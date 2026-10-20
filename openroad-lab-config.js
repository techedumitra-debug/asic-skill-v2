// v37.0.22 Guided OpenROAD PnR API (separate from EDA cloud API on 8090).
// On a deployed HTTPS website, supply a secure HTTPS URL via this variable.
// Example: const PRODUCTION_LAB_API = "https://guided-lab.example.com";
const PRODUCTION_LAB_API = "";
const LOCAL_LAB_API = "http://127.0.0.1:8080";
const localHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
window.ASIC_SKILL_LAB_API = localHost ? LOCAL_LAB_API : PRODUCTION_LAB_API;
