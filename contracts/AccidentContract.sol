// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AccidentContract {

    enum Status {
        Declared,
        Assigned,
        Expertise,
        Validated,
        Indemnised,
        Closed
    }

    struct Accident {
        uint id;
        string location;
        uint timestamp;
        string evidenceHash;
        address driver;
        address expert;
        Status status;
    }

    address public owner;
    uint public accidentCount;
    mapping(uint => Accident) public accidents;
    mapping(address => bool) public drivers;
    mapping(address => bool) public experts;

    event AccidentDeclared(uint id, address driver);
    event ExpertAssigned(uint id, address expert);
    event StatusUpdated(uint id, Status status);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyDriver() {
        require(drivers[msg.sender], "Not a registered driver");
        _;
    }

    modifier onlyExpert() {
        require(experts[msg.sender], "Not a registered expert");
        _;
    }

    modifier accidentExists(uint _id) {
        require(accidents[_id].id != 0, "Accident not found");
        _;
    }

    function registerDriver(address _driver) public onlyOwner {
        drivers[_driver] = true;
    }

    function registerExpert(address _expert) public onlyOwner {
        experts[_expert] = true;
    }

    function declareAccident(
        string memory _location,
        string memory _hash
    ) public onlyDriver {
        accidentCount++;
        accidents[accidentCount] = Accident({
            id: accidentCount,
            location: _location,
            timestamp: block.timestamp,
            evidenceHash: _hash,
            driver: msg.sender,
            expert: address(0),
            status: Status.Declared
        });
        emit AccidentDeclared(accidentCount, msg.sender);
    }

    function assignExpert(uint _id, address _expert)
        public
        onlyOwner
        accidentExists(_id)
    {
        require(experts[_expert], "Not a registered expert");
        accidents[_id].expert = _expert;
        accidents[_id].status = Status.Assigned;
        emit ExpertAssigned(_id, _expert);
    }

    function updateStatus(uint _id, Status _status)
        public
        onlyExpert
        accidentExists(_id)
    {
        require(accidents[_id].expert == msg.sender, "Not assigned expert");
        accidents[_id].status = _status;
        emit StatusUpdated(_id, _status);
    }

    function getAccident(uint _id)
        public
        view
        accidentExists(_id)
        returns (Accident memory)
    {
        return accidents[_id];
    }
}
