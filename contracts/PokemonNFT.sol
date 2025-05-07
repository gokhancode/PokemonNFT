// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title PokemonNFT
 * @dev Implementation of a Pokémon NFT with enhanced security and metadata
 * @notice This contract handles the creation and management of Pokémon NFTs with stats and metadata
 */
contract PokemonNFT is ERC721Enumerable, ERC721URIStorage, AccessControl, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    Counters.Counter private _tokenIds;
    uint256 private _nonce;
    
    // Emergency stop mechanism
    bool public paused;
    
    /**
     * @dev Structure to store Pokemon data
     * @param number The Pokemon's Pokedex number
     * @param name The Pokemon's name
     * @param type1 The Pokemon's primary type
     * @param type2 The Pokemon's secondary type (can be empty)
     * @param hp The Pokemon's HP stat (with random variation)
     * @param attack The Pokemon's Attack stat (with random variation)
     * @param defense The Pokemon's Defense stat (with random variation)
     * @param speed The Pokemon's Speed stat (with random variation)
     * @param special The Pokemon's Special stat (with random variation)
     * @param imageUrl URL to the Pokemon's image
     * @param description A description of the Pokemon
     */
    struct Pokemon {
        uint256 number;
        string name;
        string type1;
        string type2;
        uint256 hp;
        uint256 attack;
        uint256 defense;
        uint256 speed;
        uint256 special;
        string imageUrl;
        string description;
    }

    // Mapping from token ID to Pokemon data
    mapping(uint256 => Pokemon) private pokemons;

    // Events
    event PokemonMinted(
        address indexed owner,
        uint256 indexed tokenId,
        uint256 pokemonNumber,
        string name,
        string type1,
        string type2
    );
    
    event ContractPaused(address indexed admin);
    event ContractUnpaused(address indexed admin);

    /**
     * @dev Constructor sets the token name and symbol and initializes roles
     */
    constructor() ERC721("Pokemon Cards", "PKMN") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
        paused = false;
    }

    /**
     * @dev Modifier to check if contract is not paused
     */
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    /**
     * @dev Pause the contract in case of emergency
     * @notice Can only be called by an admin
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        paused = true;
        emit ContractPaused(msg.sender);
    }

    /**
     * @dev Unpause the contract
     * @notice Can only be called by an admin
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        paused = false;
        emit ContractUnpaused(msg.sender);
    }

    /**
     * @dev Generates a random number between 0 and max-1
     * @param max The upper bound (exclusive)
     * @return randomNumber A random number
     */
    function _random(uint256 max) private returns (uint256) {
        _nonce++;
        return uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            msg.sender,
            _nonce
        ))) % max;
    }

    /**
     * @dev Adjusts a stat with a random variation between -10 and +10
     * @param baseStat The base stat value
     * @return adjustedStat The adjusted stat value
     */
    function _adjustStat(uint256 baseStat) private returns (uint256) {
        uint256 variation = _random(21);
        int256 adjusted = int256(baseStat) + int256(variation) - 10;
        if (adjusted < 0) return 0;
        if (adjusted > 250) return 250;
        return uint256(adjusted);
    }

    /**
     * @dev Creates the metadata JSON for a Pokemon
     * @param pokemon The Pokemon data
     * @return metadata The JSON string containing the Pokemon's metadata
     */
    function _createMetadataJSON(Pokemon memory pokemon) private pure returns (string memory) {
        return string(abi.encodePacked(
            '{"name":"', pokemon.name, ' #', Strings.toString(pokemon.number), '",',
            '"description":"', pokemon.description, '",',
            '"image":"', pokemon.imageUrl, '",',
            '"attributes":[',
            '{"trait_type":"Type 1","value":"', pokemon.type1, '"},',
            '{"trait_type":"Type 2","value":"', pokemon.type2, '"},',
            '{"trait_type":"HP","value":', Strings.toString(pokemon.hp), '},',
            '{"trait_type":"Attack","value":', Strings.toString(pokemon.attack), '},',
            '{"trait_type":"Defense","value":', Strings.toString(pokemon.defense), '},',
            '{"trait_type":"Speed","value":', Strings.toString(pokemon.speed), '},',
            '{"trait_type":"Special","value":', Strings.toString(pokemon.special), '}',
            ']}'
        ));
    }

    /**
     * @dev Mints a new Pokemon NFT with random stat variations
     * @param _number The Pokemon's Pokedex number
     * @param _name The Pokemon's name
     * @param _type1 The Pokemon's primary type
     * @param _type2 The Pokemon's secondary type
     * @param _hp The Pokemon's base HP stat
     * @param _attack The Pokemon's base Attack stat
     * @param _defense The Pokemon's base Defense stat
     * @param _speed The Pokemon's base Speed stat
     * @param _special The Pokemon's base Special stat
     * @param _imageUrl URL to the Pokemon's image
     * @param _description A description of the Pokemon
     */
    function mintPokemon(
        uint256 _number,
        string memory _name,
        string memory _type1,
        string memory _type2,
        uint256 _hp,
        uint256 _attack,
        uint256 _defense,
        uint256 _speed,
        uint256 _special,
        string memory _imageUrl,
        string memory _description
    ) public whenNotPaused nonReentrant {
        require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_type1).length > 0, "Type1 cannot be empty");
        require(_hp > 0, "HP must be greater than zero");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        Pokemon memory newPokemon = Pokemon({
            number: _number,
            name: _name,
            type1: _type1,
            type2: _type2,
            hp: _adjustStat(_hp),
            attack: _adjustStat(_attack),
            defense: _adjustStat(_defense),
            speed: _adjustStat(_speed),
            special: _adjustStat(_special),
            imageUrl: _imageUrl,
            description: _description
        });

        pokemons[newTokenId] = newPokemon;
        _safeMint(msg.sender, newTokenId);
        
        // Set the token URI using ERC721URIStorage
        string memory metadata = _createMetadataJSON(newPokemon);
        _setTokenURI(newTokenId, metadata);

        emit PokemonMinted(
            msg.sender,
            newTokenId,
            _number,
            _name,
            _type1,
            _type2
        );
    }

    /**
     * @dev Returns all data for a specific Pokemon
     * @param tokenId The ID of the Pokemon to query
     * @return number The Pokemon's Pokedex number
     * @return name The Pokemon's name
     * @return type1 The Pokemon's primary type
     * @return type2 The Pokemon's secondary type
     * @return hp The Pokemon's HP stat
     * @return attack The Pokemon's Attack stat
     * @return defense The Pokemon's Defense stat
     * @return speed The Pokemon's Speed stat
     * @return special The Pokemon's Special stat
     * @return imageUrl URL to the Pokemon's image
     * @return description A description of the Pokemon
     */
    function getPokemon(uint256 tokenId) public view returns (
        uint256 number,
        string memory name,
        string memory type1,
        string memory type2,
        uint256 hp,
        uint256 attack,
        uint256 defense,
        uint256 speed,
        uint256 special,
        string memory imageUrl,
        string memory description
    ) {
        require(_exists(tokenId), "Token does not exist");
        Pokemon memory pokemon = pokemons[tokenId];
        return (
            pokemon.number,
            pokemon.name,
            pokemon.type1,
            pokemon.type2,
            pokemon.hp,
            pokemon.attack,
            pokemon.defense,
            pokemon.speed,
            pokemon.special,
            pokemon.imageUrl,
            pokemon.description
        );
    }

    /**
     * @dev Grant the minter role to a new address
     * @param minter Address to receive the minter role
     */
    function addMinter(address minter) external onlyRole(ADMIN_ROLE) {
        grantRole(MINTER_ROLE, minter);
    }

    /**
     * @dev Remove the minter role from an address
     * @param minter Address to lose the minter role
     */
    function removeMinter(address minter) external onlyRole(ADMIN_ROLE) {
        revokeRole(MINTER_ROLE, minter);
    }

    /**
     * @dev Required override for _beforeTokenTransfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal virtual override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);
    }

    /**
     * @dev Required override for tokenURI
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @dev Required override for supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Required override for _burn
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        delete pokemons[tokenId];
    }
} 