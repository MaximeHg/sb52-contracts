pragma solidity ^0.4.18;

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  /**
  * @dev Substracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}

contract BallotSB52 {
  using SafeMath for uint;
  uint public forResult;
  uint public againstResult;
  uint public result;
  address bettingContract;
  mapping (address => bool) voted;
  mapping (address => bool) votes;
  uint public constant votingPeriod = 7 days;
  uint public votingStart;
  uint public votingEnd;
  uint public possibleVoters;
  bool public validResult;
  bool public closed;
  uint public totalVoters;
  // XX.XXX%
  uint public threshold;

  function BallotSB52(uint team, uint voters, uint th) public {
    result = team;
    possibleVoters = voters;
    validResult = false;
    closed = false;
    votingStart = now;
    bettingContract = msg.sender;
    totalVoters = 0;
    threshold = th;
  }

  // you can only vote once
  function voteResult(bool approve, address voter) public {
    require(votingStart <= now && votingEnd >= now);
    require(msg.sender == bettingContract);
    require(voted[voter] == false);
    require(!closed);
    if(approve) forResult += 1;
    else againstResult += 1;
    voted[voter] = true;
    votes[voter] = approve;
    totalVoters += 1;
  }

  function closeBallot() public returns (bool) {
    require(!closed);
    require(now > votingEnd);
    if(totalVoters > possibleVoters.div(2)) {
      if(forResult.mul(100000).div(totalVoters) >= threshold) {
        validResult = true;
      }
    }
    closed = true;
    return validResult;
  }
}


contract Superbowl52 {
  using SafeMath for uint;
  uint public constant GAME_START_TIME = 1517787000;
  bool public resultConfirmed = false;
  address public owner;

  mapping(address => betting) bets;
  uint public totalBets;
  uint public philadelphiaBets;
  uint public newEnglandBets;
  uint public result;
  uint public betters;
  bool public votingOpen;
  bool public withdrawalOpen;
  uint public threshold;
  bool public deadlocked;

  BallotSB52 ballot;

  struct betting {
    uint philadelphiaBets;
    uint newEnglandBets;
    bool claimed;
  }

  function Superbowl52() public {
    owner = msg.sender;
    result = 0;
    votingOpen = false;
    withdrawalOpen = false;
    // 75%
    threshold = 75000;
    deadlocked = false;
  }

  modifier notDeadlocked() {
    require(!deadlocked);
    _;
  }

  // team 1 is Philadelphia
  // team 2 is New England
  // a bet is final and you cannot change it
  function bet(uint team) public payable {
    require(team == 1 || team == 2);
    require(now <= GAME_START_TIME);
    require(msg.value > 0);
    if(!hasBet(msg.sender)) betters += 1;
    if(team == 1) {
      bets[msg.sender].philadelphiaBets += msg.value;
      philadelphiaBets += msg.value;
    } else if (team == 2) {
      bets[msg.sender].newEnglandBets += msg.value;
      newEnglandBets += msg.value;
    }
    totalBets += msg.value;
  }

  function () public payable {
    revert();
  }

  function getPhiladelphiaBets(address better) public constant returns (uint) {
    return bets[better].philadelphiaBets;
  }

  function getNewEnglandBets(address better) public constant returns (uint) {
    return bets[better].newEnglandBets;
  }

  function isClaimed(address better) public constant returns (bool) {
    return bets[better].claimed;
  }

  function setResult(uint team) public notDeadlocked {
    require(msg.sender == owner);
    require(votingOpen == false);
    require(withdrawalOpen == false);
    result = team;
    votingOpen = true;
    ballot = new BallotSB52(team, betters, threshold);
  }

  function approveResult() public {
    require(votingOpen);
    ballot.voteResult(true, msg.sender);
  }

  function disapproveResult() public {
    require(votingOpen);
    ballot.voteResult(false, msg.sender);
  }

  function hasBet(address better) public constant returns (bool) {
    return (bets[better].philadelphiaBets + bets[better].newEnglandBets) > 0;
  }

  function endVoting(uint team) public notDeadlocked {
    require(votingOpen);
    if(ballot.closeBallot()) {
      // match ends without a winner
      if(result == 3) deadlocked = true;
      else {
        withdrawalOpen = true;
        votingOpen = false;
      }
    } else {
      threshold = threshold - 5000;
      if(threshold >= 50000) ballot = new BallotSB52(team, betters, threshold);
      else deadlocked = true;
    }
  }

  function refund() public {
    require(deadlocked);
    uint toRefund = getNewEnglandBets(msg.sender) + getPhiladelphiaBets(msg.sender);
    msg.sender.transfer(toRefund);
  }

  function getWinnings() public notDeadlocked {
    require(withdrawalOpen);
    require(bets[msg.sender].claimed == false);
    uint winnings;
    uint phiBets = getPhiladelphiaBets(msg.sender);
    uint neBets = getNewEnglandBets(msg.sender);
    if(result == 1) winnings = phiBets.div(totalBets);
    else winnings = neBets.div(totalBets);
    bets[msg.sender].claimed = true;
    msg.sender.transfer(winnings);
  }

}
