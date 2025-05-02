// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title PokemonNFT
 * @dev An ERC721 contract for Pokemon NFTs with custom metadata and minting functionality
 * Features:
 * - Unique Pokemon cards with stats and metadata
 * - Random stat variations for each minted Pokemon
 * - Custom token URI generation
 */
contract PokemonNFT is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    uint256 private _nonce;

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

    // Event emitted when a new Pokemon is minted
    event PokemonMinted(address indexed owner, uint256 indexed tokenId, uint256 pokemonNumber);

    /**
     * @dev Constructor sets the token name and symbol
     */
    constructor() ERC721("Pokemon Cards", "PKMN") {}

    /**
     * @dev Generates a random number between 0 and max-1
     * @param max The upper bound (exclusive)
     * @return A random number
     * Note: Uses a combination of block data and sender address for randomness
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
     * @return The adjusted stat value
     * Note: Ensures the final stat stays between 0 and 250
     */
    function _adjustStat(uint256 baseStat) private returns (uint256) {
        // Generate random number between 0 and 20
        uint256 variation = _random(21);
        // Convert to range -10 to +10
        int256 adjusted = int256(baseStat) + int256(variation) - 10;
        // Ensure stat stays between 0 and 250
        if (adjusted < 0) return 0;
        if (adjusted > 250) return 250;
        return uint256(adjusted);
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
     * Note: Each stat will be randomly adjusted by -10 to +10 points
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
    ) public {
        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // Create Pokemon struct with adjusted stats in a single step
        pokemons[newTokenId] = Pokemon({
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

        _safeMint(msg.sender, newTokenId);

        emit PokemonMinted(msg.sender, newTokenId, _number);
    }

    /**
     * @dev Returns all data for a specific Pokemon
     * @param tokenId The ID of the Pokemon to query
     * @return number The Pokemon's Pokedex number
     * @return name The Pokemon's name
     * @return type1 The Pokemon's primary type
     * @return type2 The Pokemon's secondary type
     * @return hp The Pokemon's HP stat (with random variation)
     * @return attack The Pokemon's Attack stat (with random variation)
     * @return defense The Pokemon's Defense stat (with random variation)
     * @return speed The Pokemon's Speed stat (with random variation)
     * @return special The Pokemon's Special stat (with random variation)
     * @return imageUrl URL to the Pokemon's image
     * @return description A description of the Pokemon
     * Requirements:
     * - Token must exist
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

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal virtual override(ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Returns the metadata URI for a token
     * @param tokenId The ID of the token to query
     * @return A base64 encoded JSON string containing the token's metadata
     * Requirements:
     * - Token must exist
     * Note: Includes only the most basic metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Token does not exist");
        Pokemon memory pokemon = pokemons[tokenId];
        
        return string(abi.encodePacked(
            'data:application/json,',
            '{"name":"', pokemon.name, ' #', Strings.toString(pokemon.number), '",',
            '"image":"', pokemon.imageUrl, '"}'
        ));
    }
} 