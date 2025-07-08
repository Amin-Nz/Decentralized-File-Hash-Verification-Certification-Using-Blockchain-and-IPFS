// contracts/FileRegistry.sol
pragma solidity ^0.8.20;

contract FileRegistry {
    address public uploader;
    string public fileHash;
    string public fileName;
    string public tag;
    uint256 public timestamp;

    constructor(
        string memory _fileHash,
        string memory _fileName,
        string memory _tag
    ) {
        uploader = msg.sender;
        fileHash = _fileHash;
        fileName = _fileName;
        tag = _tag;
        timestamp = block.timestamp;
    }

    function getFileInfo() public view returns (
        address, string memory, string memory, uint256
    ) {
        return (uploader, fileName, tag, timestamp);
    }
}
