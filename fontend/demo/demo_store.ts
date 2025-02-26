import { defineStore } from 'pinia';
import type demo from "./demo";

interface demo_state {
    List_Demo : demo[];
}
export const demo_store = defineStore('demo', {
    state:(): demo_state => ({
        List_Demo:[]
    }),
    actions:{
        async fetchDemo() {
            try {
                const response = await fetch('http://localhost:8080/demo/all', {
                    method: 'GET'
                });
                const data = await response.json() as demo[];
                this.List_Demo = data;
                return data;
            } catch (e) {
                console.log(e);
            }
        }
    }
})