<template>
  <v-container grid-list-md text-xs-center>
    <pie-chart
      :messages="{empty: 'No investments currently present'}"
      :legend="false"
      :data="chartData"
    ></pie-chart>
    <v-layout row justify-space-between>
      <v-flex xs5 pr-4>
        <form @submit.prevent="buyTokens">
          <v-layout row justify-start>
            <div class="subheading text-uppercase font-weight-bold">Buy RT with ETH</div>
          </v-layout>
          <v-layout row pb-3>
            <v-flex xs6>
              <v-text-field
                v-model="buyrt"
                type="number"
                :rules="[rules.numeric]"
                validate-on-blur
                suffix="ETH"
                label="Amount"
              ></v-text-field>
            </v-flex>
            <v-flex xs5 pt-4>
              <p>{{ (buyrt * 1000).toFixed() }} RT</p>
            </v-flex>
            <v-flex xs3>
              <v-btn type="submit" color="info">Buy</v-btn>
            </v-flex>
          </v-layout>
        </form>
        <form @submit.prevent="sellTokens">
          <v-layout row justify-start>
            <div class="subheading text-uppercase font-weight-bold">Sell RT for ETH</div>
          </v-layout>
          <v-layout row>
            <v-flex xs6>
              <v-text-field
                v-model="sellrt"
                type="number"
                :rules="[rules.numeric]"
                validate-on-blur
                suffix="RT"
                label="Amount"
              ></v-text-field>
            </v-flex>
            <v-flex xs5 pt-4>
              <p v-if="sellrt > 100">{{ (sellrt / 1000 - 0.1).toFixed(2)}} ETH</p>
              <p v-else>{{ 0 }} ETH</p>
            </v-flex>
            <v-flex xs3>
              <v-btn type="submit" color="info">Sell</v-btn>
            </v-flex>
          </v-layout>
        </form>
      </v-flex>
      <v-flex xs10 pt-5>
        <v-scroll-y-transition mode="out-in">
          <div
            v-if="poolValue === 0"
            class="headline text-uppercase"
            key="1"
          >Pool: {{poolValue}} RT ~ {{poolValue / 1000}} ETH</div>
          <div
            v-else
            class="headline text-uppercase"
            key="2"
          >Pool: {{poolValue}} RT ~ {{poolValue / 1000}} ETH</div>
        </v-scroll-y-transition>
        <v-scroll-y-transition mode="out-in">
          <div v-if="invested === 0" class="subheader text-uppercase" key="1">Invested: {{invested}}</div>
          <div v-else class="subheader text-uppercase" key="2">Invested: {{invested}}</div>
        </v-scroll-y-transition>
        <v-scroll-y-transition mode="out-in">
          <div
            v-if="chancesToWin === 0"
            class="subheader text-uppercase"
            key="1"
          >Chances to win: {{ chancesToWin }} %</div>
          <div v-else class="subheader text-uppercase" key="2">Chances to win: {{ chancesToWin }} %</div>
        </v-scroll-y-transition>
        <v-scroll-y-transition mode="out-in">
          <div v-if="countdown === '0:00'" class="subheader text-uppercase" key="1">
            <div>Waiting for new investments</div>
          </div>
          <div v-else class="subheader text-uppercase" key="2">
            <div>Time left</div>
            <div>{{ countdown }}</div>
          </div>
        </v-scroll-y-transition>
      </v-flex>
      <v-flex xs5 pl-4>
        <v-layout row justify-start>
          <div
            class="subheader text-uppercase"
          >Balance: {{accountBalance}} RT ~ {{accountBalance / 1000}} ETH</div>
        </v-layout>
        <v-select
          :items="items"
          v-model="selectedAccount"
          v-on:input="getSenderBalance()"
					:rules="[rules.required]"
          label="Select account"
        ></v-select>
        <form @submit.prevent="investTokens">
          <v-text-field
            v-model="amountToInvest"
            type="number"
            :rules="[rules.numeric]"
            label="Amount"
						suffix="RT"
          ></v-text-field>
          <v-layout row justify-end>
            <v-btn type="submit" color="info">Invest</v-btn>
          </v-layout>
        </form>
      </v-flex>
    </v-layout>
    <v-snackbar v-model="snackbar" bottom>
      {{ snackbarMessage }}
      <v-btn :color="snackbarColor" flat @click="snackbar = false">Close</v-btn>
    </v-snackbar>
  </v-container>
</template>
<script>
/* eslint-disable */
import io from "socket.io-client";

const web3 = new Web3(new Web3.providers.HttpProvider("HTTP://127.0.0.1:7545"));
const abi = JSON.parse(
  '[{"constant":true,"inputs":[],"name":"balanceOfPool","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"destory","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"sellTokens","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"amount","type":"uint256"}],"name":"investInPool","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"balanceOfSender","outputs":[{"name":"balance","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[],"name":"buyTokens","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[],"name":"poolPay","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"}]'
);
const contr = web3.eth.contract(abi);
const contract = contr.at("0xf8f753cde3d82cc91a61fcd8cfa3245166dac294");

const promisify = inner =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    })
  );

export default {
  data: () => ({
    buyrt: "",
    sellrt: "",
    amountToInvest: "",
    poolValue: 0,
    chancesToWin: 0,
    selectedAccount: "",
    accountBalance: 0,
    items: [],
    socket: io("localhost:3001"),
    poruka: [],
    countdown: 0,
    invested: 0,
    chartData: null,
    balanceBefore: 0,
    snackbar: false,
    snackbarColor: "",
		snackbarMessage: "",
    rules: {
			required: value => !!value || 'Required!',
      numeric: value => {
        const pattern = /^[0-9]*$/;
        return pattern.test(value) || "Value can't be negative";
      }
    }
  }),
  methods: {
    buyTokens: function() {
      let from = web3.eth.accounts[this.items.indexOf(this.selectedAccount)];

      contract.buyTokens(
        {
          from: from,
          value: this.buyrt * 1000000000000000000,
          gas: 3000000
        },
        function(err, res) {
          console.log(res);
        }
      );

      this.getSenderBalance();
    },
    sellTokens: function() {
      let from = web3.eth.accounts[this.items.indexOf(this.selectedAccount)];

      contract.sellTokens(this.sellrt, { from: from, gas: 3000000 }, function(
        err,
        res
      ) {
        console.log(res);
      });

      this.getSenderBalance();
    },
    investTokens: function() {
			if(this.selectedAccount === "" || this.amountToInvest == 0)
				return

			let from = web3.eth.accounts[this.items.indexOf(this.selectedAccount)];

      contract.investInPool(
        this.amountToInvest,
        { from: from, gas: 3000000 },
        function(err, res) {
          console.log(res);
          console.log(err);
        }
      );

      this.sendMessage({
        address: from,
        amount: this.amountToInvest
      });

      this.getSenderBalance();
      this.setPoolStatistics();
    },
    setPoolStatistics: function() {
      this.resetStatistics();

      let poolSum = 0;
      let _invested = 0;
      let from = web3.eth.accounts[this.items.indexOf(this.selectedAccount)];

      this.poruka.forEach(element => {
        poolSum += parseInt(element.amount);

        this.chartData.push([element.address, parseInt(element.amount)]);

        if (element.address === from) {
          this.invested = element.amount;
        }
      });

      this.poolValue = poolSum;

      if (this.invested === 0) {
        this.chancesToWin = 0;
      } else {
        this.chancesToWin = ((this.invested / this.poolValue) * 100).toFixed(2);
      }
    },
    resetStatistics: function() {
      this.chartData = [];
      this.invested = 0;
      this.chancesToWin = 0;
    },
    getSenderBalance: async function() {
      let from = web3.eth.accounts[this.items.indexOf(this.selectedAccount)];

      let balance = await promisify(res =>
        contract.balanceOfSender({ from: from }, res)
      );

      this.accountBalance = parseInt(balance);

      this.resetStatistics();
      this.setPoolStatistics();
    },
    sendMessage: function(message) {
      this.socket.emit("message", message);
    }
  },
  created: function() {
    let accounts = web3.eth.accounts;

    accounts.forEach(element => {
      this.items.push(
        element.slice(0, 4) +
          "..." +
          element.slice(element.length - 4, element.length)
      );
    });

    this.setPoolStatistics();
  },
  mounted() {
    this.socket.on("message", message => {
      this.poruka = message;

      this.setPoolStatistics();
    });
    this.socket.on("time", async time => {
      let sec = time % 60;
      let min = (time - sec) / 60;
      this.balanceBefore = this.accountBalance;

      if (time % 60 < 10) this.countdown = min + ":0" + sec;
      else this.countdown = min + ":" + sec;

      if (min === 0 && sec === 0) {
        this.poruka = [];
        this.setPoolStatistics();
        +(await this.getSenderBalance());
        this.countdown = "0:00";

        if (this.balanceBefore < this.accountBalance) {
          this.snackbar = true;
          this.snackbarColor = "success";
          this.snackbarMessage = "You have won!";
        } else {
          this.snackbar = true;
          this.snackbarColor = "error";
          this.snackbarMessage = "You have lost!";
        }
      }
    });
  }
};
</script>

<style>
</style>
