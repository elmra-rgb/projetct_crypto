// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  RoleRegistry
 * @notice Gestion décentralisée des rôles (auto-enregistrement via wallet).
 *
 * @dev    Contrat indépendant — aucune dépendance vers la logique métier.
 *         Peut être réutilisé par plusieurs contrats de logique métier.
 *
 *         Modèle de sécurité :
 *         - Chaque wallet s'enregistre une seule fois avec un rôle
 *         - L'owner peut révoquer un acteur sans effacer son rôle (auditabilité)
 *         - `hasRole()` est la fonction centrale utilisée par le contrat orchestrateur
 */
contract RoleRegistry {

    // ─────────────────────────────────────────────────────────────────────────
    // CONSTANTES DE RÔLES
    // ─────────────────────────────────────────────────────────────────────────

    /// @dev Hash keccak256 de "DRIVER" — comparaison O(1), résistante aux collisions
    bytes32 public constant ROLE_DRIVER  = keccak256("DRIVER");

    /// @dev Hash keccak256 de "EXPERT"
    bytes32 public constant ROLE_EXPERT  = keccak256("EXPERT");

    /// @dev Hash keccak256 de "INSURER"
    bytes32 public constant ROLE_INSURER = keccak256("INSURER");

    // ─────────────────────────────────────────────────────────────────────────
    // ÉTAT
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Adresse du déployeur (administrateur)
    address public owner;

    /// @dev Rôle de chaque acteur : adresse → bytes32
    mapping(address => bytes32) private actorRoles;

    /// @dev Statut actif de chaque acteur (false = révoqué)
    mapping(address => bool)    private activeActors;

    // ─────────────────────────────────────────────────────────────────────────
    // ÉVÉNEMENTS
    // ─────────────────────────────────────────────────────────────────────────

    /// @notice Émis quand un wallet s'enregistre avec un rôle
    event RoleRegistered(address indexed actor, bytes32 indexed role);

    /// @notice Émis quand l'owner révoque un acteur
    event RoleRevoked(address indexed actor);

    // ─────────────────────────────────────────────────────────────────────────
    // MODIFICATEURS
    // ─────────────────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "RoleRegistry: not owner");
        _;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CONSTRUCTEUR
    // ─────────────────────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // AUTO-ENREGISTREMENT (DApp — sans backend)
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Permet à n'importe quel wallet de s'enregistrer avec un rôle.
     *         msg.sender est automatiquement l'adresse enregistrée.
     *
     * @dev    Un wallet ne peut s'enregistrer qu'une seule fois.
     *         Un acteur révoqué ne peut pas se ré-enregistrer avec la même adresse.
     *
     * @param  role  Le rôle souhaité : ROLE_DRIVER | ROLE_EXPERT | ROLE_INSURER
     */
    function register(bytes32 role) external {
        require(
            role == ROLE_DRIVER || role == ROLE_EXPERT || role == ROLE_INSURER,
            "RoleRegistry: role inconnu"
        );
        require(!activeActors[msg.sender], "RoleRegistry: deja enregistre");

        actorRoles[msg.sender]   = role;
        activeActors[msg.sender] = true;

        emit RoleRegistered(msg.sender, role);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMINISTRATION
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Révoque un acteur enregistré (fraude, erreur, fin de contrat).
     *         L'acteur révoqué ne peut plus effectuer d'actions sur les contrats
     *         qui s'appuient sur ce registre.
     *
     * @dev    Le rôle n'est pas effacé — il reste consultable pour l'audit.
     *         Seul l'owner du registre peut révoquer.
     *
     * @param  actor  Adresse wallet à révoquer
     */
    function revokeRole(address actor) external onlyOwner {
        activeActors[actor] = false;
        emit RoleRevoked(actor);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LECTURE
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * @notice Retourne le rôle (bytes32) d'une adresse.
     *         Retourne bytes32(0) si l'adresse n'est jamais enregistrée.
     */
    function getRole(address actor) external view returns (bytes32) {
        return actorRoles[actor];
    }

    /**
     * @notice Retourne true si l'acteur est enregistré et non révoqué.
     */
    function isActive(address actor) external view returns (bool) {
        return activeActors[actor];
    }

    /**
     * @notice Vérifie qu'un acteur est actif ET possède exactement le rôle attendu.
     *         Fonction centrale utilisée par le contrat orchestrateur AccidentDApp.
     *
     * @param  actor  Adresse à vérifier
     * @param  role   Rôle attendu (ex. ROLE_DRIVER)
     * @return        true si actif et rôle correspond
     */
    function hasRole(address actor, bytes32 role) external view returns (bool) {
        return activeActors[actor] && actorRoles[actor] == role;
    }
}
