// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  AccidentStorage
 * @notice Couche de stockage pur des dossiers d'accidents — aucune logique métier.
 *
 * @dev    Contrat indépendant suivant le pattern "Storage / Logic Separation".
 *
 *         Modèle d'accès :
 *         - Lecture (view) : publique — tout le monde peut lire
 *         - Écriture       : réservée au `authorizedController` (AccidentDApp)
 *
 *         Ce contrat peut être remplacé par une nouvelle version de la logique métier
 *         sans perdre les données historiques — il suffit de pointer le nouveau
 *         AccidentDApp vers ce même AccidentStorage.
 *
 *         Cycle de vie d'un dossier :
 *         Declared → Verification → Expertise → Validated / Rejected → Closed
 */
contract AccidentStorage {

    // ─────────────────────────────────────────────────────────────────────────
    // ÉNUMÉRATIONS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @dev Représente l'état d'avancement d'un dossier d'accident.
     *      Déclaré ici afin que les autres contrats puissent importer ce type.
     */
    enum Status {
        Declared,     // 0 — Conducteur a soumis le constat
        Verification, // 1 — Expert assigné, en attente de son rapport
        Expertise,    // 2 — Rapport d'expertise soumis
        Validated,    // 3 — Assureur a validé (indemnisation en cours)
        Rejected,     // 4 — Assureur a rejeté (motif émis en événement)
        Closed        // 5 — Dossier clôturé et archivé
    }

    // ─────────────────────────────────────────────────────────────────────────
    // STRUCTURES
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @dev Structure principale d'un dossier d'accident.
     *      Les données sensibles (description, détails véhicule) sont stockées
     *      off-chain sur IPFS — seuls les hash SHA-256 et CID sont on-chain.
     */
    struct Accident {
        uint256 id;            // Identifiant unique auto-incrémenté (commence à 1)
        address driver;        // Wallet du conducteur déclarant
        address expert;        // Wallet de l'expert assigné (address(0) si aucun)
        address insurer;       // Wallet de l'assureur traitant (address(0) si aucun)
        string  evidenceHash;  // SHA-256 des preuves conducteur (64 chars hex)
        string  evidenceCID;   // CID IPFS des preuves conducteur
        string  reportHash;    // SHA-256 du rapport d'expertise (vide avant expertise)
        string  reportCID;     // CID IPFS du rapport d'expertise
        string  location;      // Lieu de l'accident
        uint256 timestamp;     // Horodatage de la déclaration (block.timestamp)
        Status  status;        // État actuel du dossier
        bool    driverSigned;  // true dès la déclaration (signature MetaMask implicite)
        bool    expertSigned;  // true après soumission du rapport
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ÉTAT
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Adresse du déployeur (administrateur du registre de stockage)
    address public owner;

    /**
     * @notice Seul ce contrat peut écrire dans le stockage.
     *         Doit être défini après le déploiement de AccidentDApp via setController().
     */
    address public authorizedController;

    /// @notice Nombre total de dossiers (les IDs vont de 1 à accidentCount)
    uint256 public accidentCount;

    /// @dev Stockage principal : ID → Accident
    mapping(uint256 => Accident) private accidents;

    // ─────────────────────────────────────────────────────────────────────────
    // ÉVÉNEMENTS
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Émis quand le contrôleur autorisé est mis à jour
    event ControllerUpdated(address indexed oldController, address indexed newController);

    // ─────────────────────────────────────────────────────────────────────────
    // MODIFICATEURS
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "AccidentStorage: not owner");
        _;
    }

    /// @dev Toute écriture est réservée au contrat de logique métier (AccidentDApp)
    modifier onlyController() {
        require(
            msg.sender == authorizedController,
            "AccidentStorage: caller is not the authorized controller"
        );
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONSTRUCTEUR
    // ─────────────────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMINISTRATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Autorise un contrat de logique métier à écrire dans ce stockage.
     *         Appelé par l'owner après le déploiement de AccidentDApp.
     *
     * @dev    Peut être mis à jour pour pointer vers une nouvelle version de la
     *         logique métier sans toucher aux données stockées.
     *
     * @param  controller  Adresse du contrat AccidentDApp à autoriser
     */
    function setController(address controller) external onlyOwner {
        require(controller != address(0), "AccidentStorage: zero address");
        emit ControllerUpdated(authorizedController, controller);
        authorizedController = controller;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ÉCRITURE (réservée au contrôleur autorisé)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Crée un nouveau dossier d'accident.
     *         Appelé par AccidentDApp.declareAccident().
     *
     * @param  driver        Wallet du conducteur
     * @param  evidenceHash  SHA-256 des preuves (64 chars hex)
     * @param  evidenceCID   CID IPFS des preuves
     * @param  location      Lieu de l'accident
     * @return               ID du dossier créé
     */
    function createAccident(
        address        driver,
        string calldata evidenceHash,
        string calldata evidenceCID,
        string calldata location
    ) external onlyController returns (uint256) {
        accidentCount++;

        accidents[accidentCount] = Accident({
            id:           accidentCount,
            driver:       driver,
            expert:       address(0),
            insurer:      address(0),
            evidenceHash: evidenceHash,
            evidenceCID:  evidenceCID,
            reportHash:   "",
            reportCID:    "",
            location:     location,
            timestamp:    block.timestamp,
            status:       Status.Declared,
            driverSigned: true,
            expertSigned: false
        });

        return accidentCount;
    }

    /**
     * @notice Assigne un expert à un dossier et passe son statut à Verification.
     * @param  id      ID du dossier
     * @param  expert  Wallet de l'expert
     */
    function setExpertAndStatus(uint256 id, address expert) external onlyController {
        accidents[id].expert = expert;
        accidents[id].status = Status.Verification;
    }

    /**
     * @notice Enregistre le rapport de l'expert et certifie sa signature.
     * @param  id          ID du dossier
     * @param  reportHash  SHA-256 du rapport
     * @param  reportCID   CID IPFS du rapport
     */
    function submitReport(
        uint256         id,
        string calldata reportHash,
        string calldata reportCID
    ) external onlyController {
        accidents[id].reportHash   = reportHash;
        accidents[id].reportCID    = reportCID;
        accidents[id].status       = Status.Expertise;
        accidents[id].expertSigned = true;
    }

    /**
     * @notice Valide un dossier : enregistre l'assureur et passe à Validated.
     * @param  id      ID du dossier
     * @param  insurer Wallet de l'assureur validant
     */
    function validateAccident(uint256 id, address insurer) external onlyController {
        accidents[id].insurer = insurer;
        accidents[id].status  = Status.Validated;
    }

    /**
     * @notice Rejette un dossier : enregistre l'assureur et passe à Rejected.
     * @param  id      ID du dossier
     * @param  insurer Wallet de l'assureur rejetant
     */
    function rejectAccident(uint256 id, address insurer) external onlyController {
        accidents[id].insurer = insurer;
        accidents[id].status  = Status.Rejected;
    }

    /**
     * @notice Clôture définitivement un dossier validé.
     * @param  id  ID du dossier
     */
    function closeAccident(uint256 id) external onlyController {
        accidents[id].status = Status.Closed;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LECTURE (view — publique, sans gas)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Retourne la structure complète d'un dossier.
     * @param  id  ID du dossier (entre 1 et accidentCount)
     */
    function getAccident(uint256 id) external view returns (Accident memory) {
        return accidents[id];
    }

    /**
     * @notice Retourne uniquement le statut d'un dossier (lecture légère).
     * @param  id  ID du dossier
     */
    function getStatus(uint256 id) external view returns (Status) {
        return accidents[id].status;
    }

    /**
     * @notice Retourne le nombre total de dossiers déclarés.
     */
    function getAccidentCount() external view returns (uint256) {
        return accidentCount;
    }

    /**
     * @notice Vérifie qu'un ID de dossier est valide (entre 1 et accidentCount).
     * @param  id  ID à vérifier
     */
    function exists(uint256 id) external view returns (bool) {
        return id > 0 && id <= accidentCount;
    }
}
