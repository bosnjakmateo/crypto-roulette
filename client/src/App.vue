<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" fixed left clipped app>
      <form @submit.prevent="sendData">
        <v-text-field v-model="abi" type="" label="ABI"></v-text-field>
        <v-text-field v-model="address" type="" label="Contract address"></v-text-field>
        <v-layout row justify-end>
          <v-btn type="submit" color="info">Send</v-btn>
        </v-layout>
      </form>
    </v-navigation-drawer>
    <v-toolbar app fixed clipped-left>
      <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title class="headline text-uppercase">
        <span>Crypto</span>
        <span class="font-weight-light">Roulette</span>
      </v-toolbar-title>
    </v-toolbar>
    <v-content>
      <Index/>
    </v-content>
  </v-app>
</template>

<script>
/* eslint-disable */ 
import Index from "./components/Index";
import axios from "axios";

export default {
  name: "App",
  components: {
    Index
  },
  data() {
    return {
      drawer: false,
			right: false,
			abi: "",
			address: ""
    };
	},
	methods: {
		sendData(){
			/*const path = 'http://localhost:5000/'

			axios.post(path, {
        abi: JSON.parse(this.abi),
        address: this.address
      })
      .then(res => {
				console.log(err)
      })
      .catch(err => {
        console.log(err)
      })*/
		}
	}
};
</script>