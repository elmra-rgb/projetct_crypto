const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const fs = require("fs");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());

/* -----------------------------
   Ensure upload folder exists
--------------------------------*/
if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
}

/* -----------------------------
   Upload configuration
--------------------------------*/
const upload = multer({ dest: "uploads/" });

/* -----------------------------
   Blockchain connection
--------------------------------*/
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");

// Default Hardhat account #0 private key (safe for local dev only)
const privateKey =
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const wallet = new ethers.Wallet(privateKey, provider);

// Load deployed contract address from deploy output file
let contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const deployedAddressFile = "./deployed-address.json";
if (fs.existsSync(deployedAddressFile)) {
    const data = JSON.parse(fs.readFileSync(deployedAddressFile, "utf8"));
    contractAddress = data.address;
    console.log("✅ Loaded contract address from file:", contractAddress);
}

const abi = [
    "function declareAccident(string location, string hash)",
    "function getAccident(uint id) view returns(tuple(uint id, string location, uint timestamp, string evidenceHash, address driver, address expert, uint8 status))",
    "function registerDriver(address driver)",
    "function registerExpert(address expert)",
    "function assignExpert(uint id, address expert)",
    "function updateStatus(uint id, uint8 status)",
    "function accidentCount() view returns(uint)"
];

const contract = new ethers.Contract(contractAddress, abi, wallet);


/* -----------------------------
   Health check
--------------------------------*/
app.get("/health", (req, res) => {
    res.json({ status: "ok", contractAddress });
});


/* -----------------------------
   Register Driver
--------------------------------*/
app.post("/register-driver", async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) return res.status(400).json({ error: "Address required" });
        const tx = await contract.registerDriver(address);
        await tx.wait();
        res.json({ message: "Driver registered", tx: tx.hash });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


/* -----------------------------
   Register Expert
--------------------------------*/
app.post("/register-expert", async (req, res) => {
    try {
        const { address } = req.body;
        if (!address) return res.status(400).json({ error: "Address required" });
        const tx = await contract.registerExpert(address);
        await tx.wait();
        res.json({ message: "Expert registered", tx: tx.hash });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


/* -----------------------------
   Declare accident manually
--------------------------------*/
app.post("/declare-accident", async (req, res) => {
    try {
        const { location, hash } = req.body;
        if (!location || !hash) return res.status(400).json({ error: "location and hash required" });
        const tx = await contract.declareAccident(location, hash);
        await tx.wait();
        res.json({ message: "Accident recorded", tx: tx.hash });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


/* -----------------------------
   Upload photo → hash → blockchain
--------------------------------*/
app.post("/upload-accident", upload.single("photo"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Photo required" });
        const location = req.body.location;
        if (!location) return res.status(400).json({ error: "Location required" });

        const filePath = req.file.path;
        const fileBuffer = fs.readFileSync(filePath);
        const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

        const tx = await contract.declareAccident(location, hash);
        await tx.wait();
        fs.unlinkSync(filePath);

        res.json({
            message: "Photo uploaded and hash stored on blockchain",
            hash,
            tx: tx.hash
        });
    } catch (error) {
        console.error("BLOCKCHAIN ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});


/* -----------------------------
   Get accident data
--------------------------------*/
app.get("/accident/:id", async (req, res) => {
    try {
        const accident = await contract.getAccident(req.params.id);
        res.json({
            id: accident.id.toString(),
            location: accident.location,
            timestamp: accident.timestamp.toString(),
            evidenceHash: accident.evidenceHash,
            driver: accident.driver,
            expert: accident.expert,
            status: accident.status.toString()
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch accident" });
    }
});


/* -----------------------------
   Start server
--------------------------------*/
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`\n🚀 AcciChain API running on port ${PORT}`);
    console.log(`📋 Contract address: ${contractAddress}`);
    console.log(`🔗 Blockchain: http://127.0.0.1:8545\n`);
});
