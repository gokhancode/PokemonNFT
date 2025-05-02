// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title PokemonTrading
 * @dev A marketplace contract for trading Pokemon NFTs with both fixed-price listings and auctions
 * Features:
 * - Fixed price listings
 * - Auctions with time limits
 * - Bidding system
 * - Secure fund handling with ReentrancyGuard
 * - Owner-only functions for contract management
 * - Emergency stop functionality
 */
contract PokemonTrading is ReentrancyGuard, Ownable, Pausable {
    // The Pokemon NFT contract interface
    IERC721 public pokemonNFT;

    /**
     * @dev Structure to store fixed-price listing information
     * @param seller The address of the Pokemon owner
     * @param price The fixed price in wei
     * @param isActive Whether the listing is currently active
     */
    struct Listing {
        address seller;
        uint256 price;
        bool isActive;
    }

    /**
     * @dev Structure to store auction information
     * @param seller The address of the Pokemon owner
     * @param startingPrice The minimum bid amount in wei
     * @param highestBid The current highest bid amount in wei
     * @param highestBidder The address of the current highest bidder
     * @param endTime The timestamp when the auction ends
     * @param isActive Whether the auction is currently active
     */
    struct Auction {
        address seller;
        uint256 startingPrice;
        uint256 highestBid;
        address highestBidder;
        uint256 endTime;
        bool isActive;
    }

    // Mapping from token ID to its listing information
    mapping(uint256 => Listing) public listings;
    // Mapping from token ID to its auction information
    mapping(uint256 => Auction) public auctions;
    // Mapping from user address to their withdrawable balance
    mapping(address => uint256) public pendingReturns;

    // Events for tracking contract state changes
    event Listed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event ListingCanceled(uint256 indexed tokenId, address indexed seller);
    event AuctionStarted(uint256 indexed tokenId, address indexed seller, uint256 startingPrice, uint256 endTime);
    event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount);
    event AuctionEnded(uint256 indexed tokenId, address indexed winner, uint256 amount);
    event AuctionCanceled(uint256 indexed tokenId, address indexed seller);

    /**
     * @dev Constructor initializes the contract with the Pokemon NFT contract address
     * @param _pokemonNFTAddress The address of the Pokemon NFT contract
     */
    constructor(address _pokemonNFTAddress) {
        pokemonNFT = IERC721(_pokemonNFTAddress);
    }

    /**
     * @dev Lists a Pokemon for sale at a fixed price
     * @param tokenId The ID of the Pokemon to list
     * @param price The fixed price in wei
     * Requirements:
     * - Contract must not be paused
     * - Caller must own the Pokemon
     * - Price must be greater than 0
     * - Pokemon must not be already listed or in auction
     */
    function listPokemon(uint256 tokenId, uint256 price) external whenNotPaused {
        require(pokemonNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(price > 0, "Price must be greater than 0");
        require(!listings[tokenId].isActive, "Already listed");
        require(!auctions[tokenId].isActive, "In auction");

        pokemonNFT.transferFrom(msg.sender, address(this), tokenId);
        
        listings[tokenId] = Listing({
            seller: msg.sender,
            price: price,
            isActive: true
        });

        emit Listed(tokenId, msg.sender, price);
    }

    /**
     * @dev Buys a listed Pokemon
     * @param tokenId The ID of the Pokemon to buy
     * Requirements:
     * - Contract must not be paused
     * - Pokemon must be listed
     * - Sent value must be at least the listing price
     */
    function buyPokemon(uint256 tokenId) external payable nonReentrant whenNotPaused {
        Listing memory listing = listings[tokenId];
        require(listing.isActive, "Not listed");
        require(msg.value >= listing.price, "Insufficient payment");

        listings[tokenId].isActive = false;
        pendingReturns[listing.seller] += msg.value;
        
        pokemonNFT.transferFrom(address(this), msg.sender, tokenId);
        
        emit Sold(tokenId, listing.seller, msg.sender, msg.value);
    }

    /**
     * @dev Cancels a fixed-price listing
     * @param tokenId The ID of the Pokemon to delist
     * Requirements:
     * - Contract must not be paused
     * - Caller must be the seller
     * - Pokemon must be listed
     */
    function cancelListing(uint256 tokenId) external whenNotPaused {
        require(listings[tokenId].seller == msg.sender, "Not the seller");
        require(listings[tokenId].isActive, "Not listed");

        listings[tokenId].isActive = false;
        pokemonNFT.transferFrom(address(this), msg.sender, tokenId);

        emit ListingCanceled(tokenId, msg.sender);
    }

    /**
     * @dev Starts an auction for a Pokemon
     * @param tokenId The ID of the Pokemon to auction
     * @param startingPrice The minimum bid amount in wei
     * @param duration The duration of the auction in seconds
     * Requirements:
     * - Contract must not be paused
     * - Caller must own the Pokemon
     * - Starting price must be greater than 0
     * - Pokemon must not be already listed or in auction
     */
    function startAuction(uint256 tokenId, uint256 startingPrice, uint256 duration) external whenNotPaused {
        require(pokemonNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(startingPrice > 0, "Starting price must be greater than 0");
        require(!listings[tokenId].isActive, "Already listed");
        require(!auctions[tokenId].isActive, "Already in auction");

        pokemonNFT.transferFrom(msg.sender, address(this), tokenId);
        
        auctions[tokenId] = Auction({
            seller: msg.sender,
            startingPrice: startingPrice,
            highestBid: 0,
            highestBidder: address(0),
            endTime: block.timestamp + duration,
            isActive: true
        });

        emit AuctionStarted(tokenId, msg.sender, startingPrice, block.timestamp + duration);
    }

    /**
     * @dev Places a bid on an auction
     * @param tokenId The ID of the Pokemon to bid on
     * Requirements:
     * - Contract must not be paused
     * - Auction must be active
     * - Auction must not have ended
     * - Bid amount must be higher than current highest bid
     */
    function placeBid(uint256 tokenId) external payable nonReentrant whenNotPaused {
        Auction storage auction = auctions[tokenId];
        require(auction.isActive, "Auction not active");
        require(block.timestamp < auction.endTime, "Auction ended");
        require(msg.value > auction.highestBid, "Bid too low");

        if (auction.highestBidder != address(0)) {
            pendingReturns[auction.highestBidder] += auction.highestBid;
        }

        auction.highestBid = msg.value;
        auction.highestBidder = msg.sender;

        emit BidPlaced(tokenId, msg.sender, msg.value);
    }

    /**
     * @dev Ends an auction and transfers the Pokemon to the highest bidder
     * @param tokenId The ID of the Pokemon in auction
     * Requirements:
     * - Contract must not be paused
     * - Auction must be active
     * - Either the auction time has ended OR the seller is ending it early with a valid bid
     */
    function endAuction(uint256 tokenId) external nonReentrant whenNotPaused {
        Auction storage auction = auctions[tokenId];
        require(auction.isActive, "Auction not active");
        require(
            block.timestamp >= auction.endTime || 
            (msg.sender == auction.seller && auction.highestBidder != address(0)),
            "Auction still active"
        );

        auction.isActive = false;

        if (auction.highestBidder != address(0)) {
            pokemonNFT.transferFrom(address(this), auction.highestBidder, tokenId);
            pendingReturns[auction.seller] += auction.highestBid;
            emit AuctionEnded(tokenId, auction.highestBidder, auction.highestBid);
        } else {
            pokemonNFT.transferFrom(address(this), auction.seller, tokenId);
            emit AuctionCanceled(tokenId, auction.seller);
        }
    }

    /**
     * @dev Withdraws the caller's pending returns
     * Requirements:
     * - Contract must not be paused
     * - Caller must have pending returns
     */
    function withdraw() external nonReentrant whenNotPaused {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingReturns[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Transfer failed");
    }

    /**
     * @dev Pauses the contract, preventing new listings, purchases, and auctions
     * Requirements:
     * - Caller must be the contract owner
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract, allowing listings, purchases, and auctions
     * Requirements:
     * - Caller must be the contract owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Emergency function to recover stuck tokens
     * @param tokenId The ID of the Pokemon to recover
     * Requirements:
     * - Caller must be the contract owner
     * - Token must be owned by this contract
     */
    function emergencyRecoverToken(uint256 tokenId) external onlyOwner {
        require(pokemonNFT.ownerOf(tokenId) == address(this), "Token not owned by contract");
        pokemonNFT.transferFrom(address(this), owner(), tokenId);
    }
} 