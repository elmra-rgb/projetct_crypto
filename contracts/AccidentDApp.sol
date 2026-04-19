// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./RoleRegistry.sol";
import "./AccidentStorage.sol";

/**
 * @title  AccidentDApp
 * @notice Logique métier — orchestration du cycle de vie des accidents automobiles.
 *
 * @dev    Architecture modulaire à 3 couches :
 *
 *         ┌─────────────────────────────────────────────────────────┐
 *         │                     AccidentDApp                        │
 *         │           (Logique métier + validation)                 │
 *         └────────────────────┬────────────────────────────────────┘
 *                              │ lit les rôles      │ lit/écrit les données
 *                              ▼                    ▼
 *                     ┌───────────────┐   ┌──────────────────────┐
 *                     │ RoleRegistry  │   │  AccidentStorage     │
 *                     │ (Rôles)       │   │  (Données pures)     │
 *                     └───────────────┘   └──────────────────────┘
 *
 *         Principes :
 *         - Ce contrat ne stocke aucune donnée métier — tout va dans AccidentStorage
 *         - Les rôles sont gérés dans RoleRegistry — réutilisable par d'autres contrats
 *         - Seul ce contrat est autorisé à écrire dans AccidentStorage (setController)
 *         - En cas de bug ou évolution, on peut redéployer AccidentDApp et pointer le
 *           nouveau contrôleur sur l'AccidentStorage existant (données préservées)
 *
 *         Cycle de vie :
 *         Declared → Verification → Expertise → Validated / Rejected → Closed
 */
contract AccidentDApp {

    // ─────────────────────────────────────────────────────────────────────────
    // RÉFÉRENCES AUX CONTRATS DÉPENDANTS
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Registre des rôles — source de vérité pour les autorisations
    RoleRegistry    public roleRegistry;

    /// @notice Stockage des dossiers — source de vérité pour les données
    AccidentStorage public accidentStorage;

    /// @notice Adresse de l'administrateur (déployeur)
    address public owner;

    // ─────────────────────────────────────────────────────────────────────────
    // CONSTANTES DE RÔLES — mises en cache pour éviter les appels externes
    // dans les modificateurs (réduit la profondeur de call stack)
    // ─────────────────────────────────────────────────────────────────────────

    bytes32 public immutable ROLE_DRIVER;
    bytes32 public immutable ROLE_EXPERT;
    bytes32 public immutable ROLE_INSURER;

    // ─────────────────────────────────────────────────────────────────────────
    // ÉVÉNEMENTS
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Émis à chaque nouvelle déclaration d'accident
    event AccidentDeclared(
        uint256 indexed id,
        address indexed driver,
        string evidenceHash,
        string evidenceCID,
        uint256 timestamp
    );

    /// @notice Émis quand un expert est assigné (par l'assureur ou en auto-assignation)
    event ExpertAssigned(uint256 indexed id, address indexed expert, address indexed insurer);

    /// @notice Émis quand l'expert soumet son rapport
    event ReportSubmitted(uint256 indexed id, address indexed expert, string reportHash, string reportCID);

    /// @notice Émis quand l'assureur valide un dossier
    event AccidentValidated(uint256 indexed id, address indexed insurer);

    /// @notice Émis quand l'assureur rejette un dossier
    event AccidentRejected(uint256 indexed id, address indexed insurer, string reason);

    /// @notice Émis quand l'owner clôture un dossier validé
    event AccidentClosed(uint256 indexed id);

    // ─────────────────────────────────────────────────────────────────────────
    // MODIFICATEURS
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "AccidentDApp: not owner");
        _;
    }

    /**
     * @dev Délègue la vérification de rôle à RoleRegistry.hasRole().
     *      Vérifie à la fois le rôle ET le statut actif (non révoqué).
     */
    modifier onlyRole(bytes32 role) {
        require(
            roleRegistry.hasRole(msg.sender, role),
            "AccidentDApp: unauthorized role"
        );
        _;
    }

    /**
     * @dev Délègue la vérification d'existence à AccidentStorage.exists().
     */
    modifier accidentExists(uint256 id) {
        require(accidentStorage.exists(id), "AccidentDApp: accident not found");
        _;
    }

    /**
     * @dev Délègue la vérification de statut à AccidentStorage.getStatus().
     *      Empêche les transitions illégales dans le cycle de vie.
     */
    modifier inStatus(uint256 id, AccidentStorage.Status expected) {
        require(
            accidentStorage.getStatus(id) == expected,
            "AccidentDApp: invalid status for this action"
        );
        _;
    }

    /**
     * @dev Valide un hash SHA-256 :
     *      - Exactement 64 caractères
     *      - Uniquement des chiffres (0-9) et lettres minuscules (a-f)
     *      Empêche le stockage de données arbitraires.
     */
    modifier validHash(string calldata h) {
        bytes memory b = bytes(h);
        require(b.length == 64, "AccidentDApp: hash must be 64 hex chars (SHA-256)");
        for (uint256 i = 0; i < 64; i++) {
            bytes1 c = b[i];
            require(
                (c >= 0x30 && c <= 0x39) || (c >= 0x61 && c <= 0x66),
                "AccidentDApp: hash must be lowercase hex"
            );
        }
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONSTRUCTEUR
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Déploie le contrat en le liant aux deux contrats de couche inférieure.
     *
     * @dev    Après le déploiement, appeler AccidentStorage.setController(address(this))
     *         pour autoriser ce contrat à écrire dans le stockage.
     *
     * @param  _roleRegistry      Adresse du contrat RoleRegistry déployé
     * @param  _accidentStorage   Adresse du contrat AccidentStorage déployé
     */
    constructor(address _roleRegistry, address _accidentStorage) {
        require(_roleRegistry    != address(0), "AccidentDApp: invalid RoleRegistry address");
        require(_accidentStorage != address(0), "AccidentDApp: invalid AccidentStorage address");

        owner            = msg.sender;
        roleRegistry     = RoleRegistry(_roleRegistry);
        accidentStorage  = AccidentStorage(_accidentStorage);

        // Mise en cache des constantes de rôles — une seule lecture externe au déploiement
        // Élimine 1 appel externe par modificateur onlyRole → réduit la profondeur de call stack
        ROLE_DRIVER  = RoleRegistry(_roleRegistry).ROLE_DRIVER();
        ROLE_EXPERT  = RoleRegistry(_roleRegistry).ROLE_EXPERT();
        ROLE_INSURER = RoleRegistry(_roleRegistry).ROLE_INSURER();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DÉCLARATION D'ACCIDENT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Le conducteur déclare un accident en soumettant les preuves.
     *         La transaction est signée par son wallet MetaMask — il est l'auteur prouvé.
     *
     * @dev    Seul un conducteur enregistré (ROLE_DRIVER) peut appeler cette fonction.
     *         Le hash doit être un SHA-256 valide (64 chars hex minuscules).
     *         driverSigned est mis à true automatiquement (signature MetaMask implicite).
     *
     * @param  evidenceHash  SHA-256 des photos/preuves calculé côté frontend
     * @param  evidenceCID   CID IPFS des preuves (vide si IPFS désactivé)
     * @param  location      Lieu de l'accident
     * @return               ID du dossier créé
     */
    function declareAccident(
        string calldata evidenceHash,
        string calldata evidenceCID,
        string calldata location
    )
        external
        onlyRole(ROLE_DRIVER)
        validHash(evidenceHash)
        returns (uint256)
    {
        require(bytes(location).length > 0, "AccidentDApp: location required");

        uint256 id = accidentStorage.createAccident(
            msg.sender,
            evidenceHash,
            evidenceCID,
            location
        );

        emit AccidentDeclared(id, msg.sender, evidenceHash, evidenceCID, block.timestamp);
        return id;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ASSIGNATION DE L'EXPERT
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice L'assureur assigne un expert à un dossier déclaré.
     *
     * @dev    Seul un assureur enregistré (ROLE_INSURER) peut assigner.
     *         Le dossier doit être au statut Declared.
     *         L'expert doit être enregistré dans RoleRegistry avec ROLE_EXPERT.
     *
     * @param  id      ID du dossier
     * @param  expert  Adresse wallet de l'expert
     */
    function assignExpert(uint256 id, address expert)
        external
        onlyRole(ROLE_INSURER)
        accidentExists(id)
        inStatus(id, AccidentStorage.Status.Declared)
    {
        require(
            roleRegistry.hasRole(expert, ROLE_EXPERT),
            "AccidentDApp: adresse non enregistree comme expert"
        );

        accidentStorage.setExpertAndStatus(id, expert);
        emit ExpertAssigned(id, expert, msg.sender);
    }

    /**
     * @notice Un expert s'auto-assigne sur un dossier déclaré sans expert.
     *         Permet à l'expert de prendre en charge directement un accident déclaré.
     *
     * @dev    Seul un expert enregistré (ROLE_EXPERT) peut s'auto-assigner.
     *         Le dossier doit être au statut Declared et sans expert assigné.
     *
     * @param  id  ID du dossier à prendre en charge
     */
    function assignSelf(uint256 id)
        external
        onlyRole(ROLE_EXPERT)
        accidentExists(id)
        inStatus(id, AccidentStorage.Status.Declared)
    {
        require(
            accidentStorage.getAccident(id).expert == address(0),
            "AccidentDApp: un expert est deja assigne"
        );

        accidentStorage.setExpertAndStatus(id, msg.sender);
        emit ExpertAssigned(id, msg.sender, address(0));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RAPPORT D'EXPERTISE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice L'expert soumet son rapport d'expertise sur la blockchain.
     *
     * @dev    Seul l'expert spécifiquement assigné à CE dossier peut soumettre.
     *         Le dossier doit être au statut Verification.
     *
     * @param  id          ID du dossier expertisé
     * @param  reportHash  SHA-256 du rapport (64 chars hex)
     * @param  reportCID   CID IPFS du rapport
     */
    function submitReport(
        uint256         id,
        string calldata reportHash,
        string calldata reportCID
    )
        external
        accidentExists(id)
        inStatus(id, AccidentStorage.Status.Verification)
        validHash(reportHash)
    {
        require(
            accidentStorage.getAccident(id).expert == msg.sender,
            "AccidentDApp: not the assigned expert"
        );

        accidentStorage.submitReport(id, reportHash, reportCID);
        emit ReportSubmitted(id, msg.sender, reportHash, reportCID);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // VALIDATION / REJET PAR L'ASSUREUR
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice L'assureur valide le dossier après lecture du rapport d'expertise.
     *
     * @dev    Seul un assureur enregistré (ROLE_INSURER) peut valider.
     *         Le dossier doit être au statut Expertise (rapport soumis).
     *
     * @param  id  ID du dossier à valider
     */
    function validateAccident(uint256 id)
        external
        onlyRole(ROLE_INSURER)
        accidentExists(id)
        inStatus(id, AccidentStorage.Status.Expertise)
    {
        accidentStorage.validateAccident(id, msg.sender);
        emit AccidentValidated(id, msg.sender);
    }

    /**
     * @notice L'assureur rejette le dossier avec un motif obligatoire.
     *         Possible depuis Verification (sans rapport) ou Expertise (avec rapport).
     *
     * @dev    Le motif est émis dans l'événement — visible off-chain sans frais.
     *         Obligatoire pour assurer la transparence du rejet.
     *
     * @param  id      ID du dossier
     * @param  reason  Motif du rejet (non vide)
     */
    function rejectAccident(uint256 id, string calldata reason)
        external
        onlyRole(ROLE_INSURER)
        accidentExists(id)
    {
        AccidentStorage.Status currentStatus = accidentStorage.getStatus(id);
        require(
            currentStatus == AccidentStorage.Status.Expertise ||
            currentStatus == AccidentStorage.Status.Verification,
            "AccidentDApp: rejet impossible a ce stade"
        );
        require(bytes(reason).length > 0, "AccidentDApp: raison requise");

        accidentStorage.rejectAccident(id, msg.sender);
        emit AccidentRejected(id, msg.sender, reason);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CLÔTURE DU DOSSIER
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice L'owner clôture définitivement un dossier validé (après indemnisation).
     *         Un dossier Closed est archivé — aucune action supplémentaire possible.
     *
     * @param  id  ID du dossier à clôturer
     */
    function closeAccident(uint256 id)
        external
        onlyOwner
        accidentExists(id)
        inStatus(id, AccidentStorage.Status.Validated)
    {
        accidentStorage.closeAccident(id);
        emit AccidentClosed(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LECTURE — Délégation vers AccidentStorage (view — gratuites)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Retourne toutes les données d'un dossier d'accident.
     *         Le frontend n'a besoin que de l'adresse AccidentDApp pour lire.
     *
     * @param  id  ID du dossier
     */
    function getAccident(uint256 id)
        external
        view
        accidentExists(id)
        returns (AccidentStorage.Accident memory)
    {
        return accidentStorage.getAccident(id);
    }

    /**
     * @notice Retourne uniquement le statut d'un dossier (lecture légère).
     *
     * @param  id  ID du dossier
     */
    function getAccidentStatus(uint256 id)
        external
        view
        accidentExists(id)
        returns (AccidentStorage.Status)
    {
        return accidentStorage.getStatus(id);
    }

    /**
     * @notice Retourne le nombre total de dossiers déclarés.
     */
    function getAccidentCount() external view returns (uint256) {
        return accidentStorage.getAccidentCount();
    }
}
