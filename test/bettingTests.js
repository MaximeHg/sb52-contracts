import EVMThrow from './helpers/EVMThrow';
import revert from './helpers/revert';

import latestTime from './helpers/latestTime';
import { increaseTimeTo, duration } from './helpers/increaseTime';

const Superbowl52 = artifacts.require("Superbowl52");
const should = require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('Superbowl52', function(accounts) {
  describe('Betting', () => {
    let Superbowl52Instance;
    // start and end timestamps where investments are allowed (both inclusive)
    let startTime = 1517787000;

    beforeEach(async () => {
      Superbowl52Instance = await Superbowl52.new({ from: accounts[0], gas:60000000});
    });

    // test will automatically fail after game time
    it("should be possible to bet before game time", async() => {
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "100"});
      let totalBets = await Superbowl52Instance.totalBets.call();
      assert.equal(totalBets, 100);
    });

    it("should be possible to bet for Philadelphia before game time", async() => {
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "100"});
      let userBets = await Superbowl52Instance.getPhiladelphiaBets.call(accounts[1]);
      assert.equal(userBets, 100);
    });

    it("should be possible to bet for New England before game time", async() => {
      await Superbowl52Instance.bet.sendTransaction(2, {from: accounts[1], value: "100"});
      let userBets = await Superbowl52Instance.getNewEnglandBets.call(accounts[1]);
      assert.equal(userBets, 100);
    });

    it("should be possible to bet for Philadelphia and New England before game time", async() => {
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "100"});
      await Superbowl52Instance.bet.sendTransaction(2, {from: accounts[1], value: "100"});
      let userBetsPHI = await Superbowl52Instance.getPhiladelphiaBets.call(accounts[1]);
      let userBetsNE = await Superbowl52Instance.getNewEnglandBets.call(accounts[1]);
      assert.equal(userBetsPHI, 100);
      assert.equal(userBetsNE, 100);
      let totalBets = await Superbowl52Instance.totalBets.call();
      assert.equal(totalBets, 200);
    });

    it("should not be possible to bet with a wrong team number", async() => {
      await Superbowl52Instance.bet.sendTransaction(3, {from: accounts[1], value: "100"}).should.be.rejectedWith(revert);
      let totalBets = await Superbowl52Instance.totalBets.call();
      assert.equal(totalBets, 0);
    });

    it("should be possible to bet twice", async() => {
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "100"});
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "100"});
      let totalBets = await Superbowl52Instance.totalBets.call();
      let userBetsPHI = await Superbowl52Instance.getPhiladelphiaBets.call(accounts[1]);
      assert.equal(userBetsPHI, 200);
      assert.equal(totalBets, 200);
    });

    it("should not be possible to bet after game time", async() => {
      await increaseTimeTo(startTime + 1);
      await Superbowl52Instance.bet.sendTransaction(1, {from: accounts[1], value: "100"}).should.be.rejectedWith(revert);
    });

  });
});
