//SPDX-License-Identifier:  MIT
pragma solidity 0.8.3;
pragma experimental ABIEncoderV2;

import "./timelib.sol";
import "./math.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract qwerStaking is AccessControl {
    using SafeMath for uint256;

    IERC20 uvwToken;

    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    bool public isActive = false;
    uint32 startOfDeposit;     // timestamp
    uint32 periodStaking;      // days
    uint32 timeAccepting;      // hours
    uint32 currentDepositID;
    address owner;
    uint48 totalDepositTokenAmount;

    struct deposit {
        uint256 id;
        address ownerAddress;
        uint48 uvwtokenAmount;
        uint48 settlementAmount;
    }

    event StakingStarted(
        uint32 _periodStaking,
        uint32 _timeAccepting
    );

    event AddDeposit(
        address _stakeOwner,
        uint48 _tokenAmount
    );

    mapping(string => bytes32) internal Roles;
    mapping(uint32 => deposit) depositByID;
    mapping(address => uint32[]) depositByOwnerAddress;

    constructor(address _token) {
        uvwToken = IERC20(_token);
        owner = msg.sender;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MANAGER_ROLE, msg.sender);
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function getTotalDepositTokenAmount()
        external
        view
        onlyOwner
        returns (uint256)
    {
        return totalDepositTokenAmount;
    }

    function getPeriodStaking() external view returns (uint32) {
        return periodStaking;
    }

    function getTimeAccepting() external view returns (uint32) {
        return timeAccepting;
    }

    function getIsActive() external view returns (bool) {
        return isActive;
    }

    function startStaking(
        uint32 _periodStaking,
        uint32 _timeAccepting
    ) external onlyRole(MANAGER_ROLE) {
        require(!isActive, 'Staking is already active');

        isActive = true;

        currentDepositID = 0;

        startOfDeposit = uint32(block.timestamp);
        periodStaking = _periodStaking;
        timeAccepting = _timeAccepting;

        emit StakingStarted(
            periodStaking,
            timeAccepting
        );
    }

    function addDeposit(
        uint48 _amount
    ) external {
        require(isActive, 'Staking is not active.');

        uint256 endOfDeposit = startOfDeposit + timeAccepting * 60 * 60;
        require(
            startOfDeposit <= block.timestamp && block.timestamp <= endOfDeposit,
            'Accepting deposit is ended.'
        );

        currentDepositID += 1;

        uvwToken.transferFrom(msg.sender, address(this), _amount);

        isActive = true;

        depositByID[currentDepositID].id = currentDepositID;
        depositByID[currentDepositID].ownerAddress = msg.sender;
        depositByID[currentDepositID].uvwtokenAmount = _amount;

        totalDepositTokenAmount += _amount;
        depositByOwnerAddress[msg.sender].push(currentDepositID);

        emit AddDeposit(
            msg.sender,
            _amount
        );
    }

    function distributeReward(
        uint256 rewards
    ) external {
        require(isActive, 'Staking is not active.');

        uint256 endOfStaking = startOfDeposit + timeAccepting * 60 * 60 + periodStaking * 24 * 60 * 60;
        require(
            block.timestamp >= endOfStaking,
            'Staking is not ended.'
        );

        for (uint32 i = 1; i <= currentDepositID; i++) {
            uint256 amountReturn = ABDKMath64x64.mulu(
                ABDKMath64x64.add(
                    ABDKMath64x64.divu(
                        ABDKMath64x64.mulu(
                            ABDKMath64x64.fromUInt(rewards),
                            depositByID[i].uvwtokenAmount
                        ),
                        totalDepositTokenAmount
                    ),
                    ABDKMath64x64.fromUInt(depositByID[i].uvwtokenAmount)
                ),
                1
            );
            depositByID[i].settlementAmount = uint48(amountReturn);

            uvwToken.transfer(depositByID[i].ownerAddress, uint48(amountReturn));
        }
    }

    function stringToBytes32(string memory source)
        internal
        pure
        returns (bytes32 result)
    {
        bytes memory _S = bytes(source);

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
