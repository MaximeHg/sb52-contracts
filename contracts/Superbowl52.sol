pragma solidity ^0.4.18;

import "./SafeMath.sol";
import "./BallotSB52.sol";

contract Superbowl52 {
  using SafeMath for uint;
  uint public constant GAME_START_TIME = 1517787000;
  bool public resultConfirmed = false;
  address public owner;

  mapping(address => betting) public bets;
  uint public totalBets;
  uint public philadelphiaBets;
  uint public newEnglandBets;
  uint public result;
  uint public betters;
  bool public votingOpen;
  bool public withdrawalOpen;
  uint public threshold;
  uint public winningPot;
  mapping(address => uint) public wins;

  BallotSB52 public ballot;

  struct betting {
    uint philadelphiaBets;
    uint newEnglandBets;
    bool claimed;
  }

  function Superbowl52() public {
    require(now<GAME_START_TIME);
    owner = msg.sender;
    result = 0;
    votingOpen = false;
    withdrawalOpen = false;
    // 90%
    threshold = 90000;
    winningPot = 0;
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

  function hasClaimed(address better) public constant returns (bool) {
    return bets[better].claimed;
  }

  function startVoting() public {
    require(msg.sender == owner);
    require(votingOpen == false);
    require(withdrawalOpen == false);
    require(now >= GAME_START_TIME + 8 hours);
    votingOpen = true;
    ballot = new BallotSB52(threshold);
  }

  function hasBet(address better) public constant returns (bool) {
    return (bets[better].philadelphiaBets + bets[better].newEnglandBets) > 0;
  }

  function endVoting() public {
    require(votingOpen);
    result = ballot.closeBallot();
    // ballot ends with success
    if (result == 1 || result == 2) {
        withdrawalOpen = true;
        votingOpen = false;
    } else {
      threshold = threshold - 5000;
      ballot = new BallotSB52(threshold);
    }
    if(result == 1) winningPot = totalBets.sub(newEnglandBets.div(100));
    if(result == 2) winningPot = totalBets.sub(philadelphiaBets.div(100));
  }

  function getLosersOnePercent(uint loser) public returns (uint) {
    require(votingOpen);
    require(msg.sender == address(ballot));
    if(loser==1) {
      ballot.transfer(philadelphiaBets.div(100));
      return philadelphiaBets.div(100);
    }
    else if (loser==2) {
      ballot.transfer(newEnglandBets.div(100));
      return newEnglandBets.div(100);
    }
    else {
      return 0;
    }
  }

  function getWinnings(address winner, uint donation) public {
    require(donation<=100);
    require(withdrawalOpen);
    require(bets[winner].claimed == false);
    uint winnings = 0;
    if (result == 1) winnings = (getPhiladelphiaBets(winner).mul(winningPot)).div(philadelphiaBets);
    else if (result == 2) winnings = (getNewEnglandBets(winner).mul(winningPot)).div(newEnglandBets);
    else revert();
    wins[winner] = winnings;
    uint donated = winnings.mul(donation).div(100);
    bets[winner].claimed = true;
    winner.transfer(winnings-donated);
  }

}
