// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title SampleContract
 * @dev Contrato de ejemplo inicial para la POC de Blockchain
 */
contract SampleContract {
    address public owner;
    string private message;
    uint256 public counter;

    event MessageUpdated(address indexed updater, string newMessage);
    event CounterIncremented(address indexed updater, uint256 newCounter);

    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el propietario puede ejecutar esta accion");
        _;
    }

    constructor(string memory initialMessage) {
        owner = msg.sender;
        message = initialMessage;
        counter = 0;
    }

    function setMessage(string memory newMessage) public {
        message = newMessage;
        emit MessageUpdated(msg.sender, newMessage);
    }

    function getMessage() public view returns (string memory) {
        return message;
    }

    function incrementCounter() public {
        counter += 1;
        emit CounterIncremented(msg.sender, counter);
    }

    function resetCounter() public onlyOwner {
        counter = 0;
    }
}
