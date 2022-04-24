// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

abstract contract BlackList is Ownable, ERC20 {

    /////// Getters to allow the same blacklist to be used also by other contracts (including upgraded Tether) ///////
    function getBlackListStatus(address _maker) external view returns (bool) {
        return isBlackListed[_maker];
    }

    function getOwner() external view returns (address) {
        return owner();
    }

    mapping (address => bool) public isBlackListed;
    
    function addBlackList (address _evilUser) public onlyOwner {
        isBlackListed[_evilUser] = true;
        AddedBlackList(_evilUser);
    }

    function removeBlackList (address _clearedUser) public onlyOwner {
        isBlackListed[_clearedUser] = false;
        RemovedBlackList(_clearedUser);
    }

    function destroyBlackFunds (address _blackListedUser) public onlyOwner {
        require(isBlackListed[_blackListedUser]);
        uint dirtyFunds = balanceOf(_blackListedUser);
        _burn(_blackListedUser, dirtyFunds);
        DestroyedBlackFunds(_blackListedUser, dirtyFunds);
    }

    event DestroyedBlackFunds(address _blackListedUser, uint _balance);

    event AddedBlackList(address _user);

    event RemovedBlackList(address _user);

}

contract uvwToken is
    ERC20,
    BlackList,
    ERC20Burnable,
    ERC20Snapshot,
    Pausable,
    AccessControl,
    ERC20Permit,
    ERC20Votes
{
    using SafeMath for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    uint256 public maxSupply;

    uint8 internal _decimals = 10;

    mapping(string => bytes32) internal Roles;

    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
        ERC20Permit(_name)
    {
        maxSupply = 1000000000 * 10**_decimals; // 1 Billion Tokens ^ 10 decimals

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function pause() public onlyRole(PAUSER_ROLE) returns (bool)  {
        _pause();
        return true;
    }

    function unpause() public onlyRole(PAUSER_ROLE) returns (bool) {
        _unpause();
        return true;
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    function burnToken(address account, uint256 amount) public onlyRole(BURNER_ROLE) {
        //super.burn(account, amount);
        _burn(account, amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev See {IERC20-totalSupply}.
     */
    function totalSupply() public view override returns (uint256) {
        return super.totalSupply();
    }

    /**
     * @dev Retrieves the total supply at the time `snapshotId` was created.
     */
    function totalSupplyAt(uint256 snapshotId) public view override returns (uint256) {
        return super.totalSupplyAt(snapshotId);
    }

    /**
     * @dev See {IERC20-balanceOf}.
     */
    function balanceOf(address account) public view override returns (uint256) {
        return super.balanceOf(account);
    }

    /**
     * @dev Retrieves the balance of `account` at the time `snapshotId` was created.
     */
    function balanceOfAt(address account, uint256 snapshotId) public view override returns (uint256) {
        return super.balanceOfAt(account, snapshotId);
    }

    /// @dev removes votes from account (accountability)
    /// @param _account account whose votes will removed 
    function _slashVotes(address _account, uint256 _amount) private whenNotPaused {
        _burn(_account, _amount);
    } 

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    )
        internal
        whenNotPaused
        override(ERC20, ERC20Snapshot)
    {
        require(!isBlackListed[msg.sender]);
        super._beforeTokenTransfer(from, to, amount);
    }

    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        require(
            totalSupply() + amount <= maxSupply,
            "Error: Max supply reached, 1 Billion tokens minted."
        );
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }

    function stringToBytes32(string memory source)
        internal
        pure
        returns (bytes32 result)
    {
        bytes memory _S = bytes(source);
        // assembly {
        //     result := mload(add(source, 32))
        // }
        return keccak256(_S);
    }

    function setRole(string memory role, address _add) public onlyRole(DEFAULT_ADMIN_ROLE) {
        bytes32 _role = stringToBytes32(role);
        Roles[role] = _role;
        _setupRole(_role, _add);
    }

    function revokeRole(string memory role, address _revoke) public onlyRole(DEFAULT_ADMIN_ROLE) {
        bytes32 _role = stringToBytes32(role);
        Roles[role] = _role;
        _revokeRole(_role, _revoke);
    }
}
