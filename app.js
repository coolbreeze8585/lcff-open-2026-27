
/*
 * LCFF OPEN 2026-27
 * Aplicació pública de consulta
 */

const API_URL =
  "https://script.google.com/macros/s/AKfycbxXDmZjb8LDNYyxpv-cwKEH36T7DGY29Hk-_iALvateg-jyWL1XGdXLweRMjrFW4J4/exec";

// Dades carregades de Google Sheets
const dadesApp = {
  jornades: [],
  seus: [],
  partits: [],
  equips: [],
  classificacio: []
};

/**
 * Consulta una taula de l'API.
 */
async function consultarAPI(taula) {
  const url =
    API_URL + "?taula=" + encodeURIComponent(taula);

  const resposta = await fetch(url);

  if (!resposta.ok) {
    throw new Error(
      "Error HTTP " + resposta.status
    );
  }

  const resultat = await resposta.json();

  if (!Array.isArray(resultat.dades)) {
    throw new Error("Resposta de l'API no vàlida");
  }

  return resultat.dades;
}

/**
 * Converteix una data YYYY-MM-DD a format català.
 * Evitem problemes de zona horària.
 */
function formatData(dataISO) {
  if (!dataISO) return "Data pendent";

  const parts = dataISO.split("-");

  if (parts.length !== 3) {
    return dataISO;
  }

  const [any, mes, dia] = parts.map(Number);

  const data = new Date(any, mes - 1, dia);

  return new Intl.DateTimeFormat("ca-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(data);
}

/**
 * Mostra la llista de jornades.
 */
function mostrarJornades() {
  const contenidor =
    document.getElementById("contingut");

  if (!contenidor) return;

  contenidor.replaceChildren();

  const titol = document.createElement("h2");
  titol.textContent = "Jornades";
  contenidor.appendChild(titol);

  if (dadesApp.jornades.length === 0) {
    const avis = document.createElement("p");
    avis.className = "estat";
    avis.textContent = "Encara no hi ha jornades.";
    contenidor.appendChild(avis);
    return;
  }

  const jornadesOrdenades =
    [...dadesApp.jornades].sort(
      (a, b) => Number(a.Numero) - Number(b.Numero)
    );

  jornadesOrdenades.forEach(jornada => {
    const targeta = document.createElement("button");
    targeta.type = "button";
    targeta.addEventListener("click", () => {
      mostrarSeus(jornada.JornadaID);
    });
    targeta.className = "card";

    const fila = document.createElement("div");
    fila.className = "card-fila";

    const informacio = document.createElement("div");

    const nom = document.createElement("h3");
    nom.textContent = jornada.Nom;

    const dates = document.createElement("p");

    if (jornada.DataInici === jornada.DataFi) {
      dates.textContent =
        formatData(jornada.DataInici);
    } else {
      dates.textContent =
        formatData(jornada.DataInici) +
        " — " +
        formatData(jornada.DataFi);
    }

    informacio.appendChild(nom);
    informacio.appendChild(dates);

    const fletxa = document.createElement("span");
    fletxa.className = "card-fletxa";
    fletxa.textContent = "›";

    fila.appendChild(informacio);
    fila.appendChild(fletxa);
    targeta.appendChild(fila);

    contenidor.appendChild(targeta);
  });
}

/**
 * Mostra un missatge d'estat.
 */
function mostrarEstat(missatge, esError = false) {
  const contenidor =
    document.getElementById("contingut");

  if (!contenidor) return;

  contenidor.replaceChildren();

  const avis = document.createElement("p");
  avis.className = esError ? "estat error" : "estat";
  avis.textContent = missatge;

  contenidor.appendChild(avis);
}


function mostrarSeus(jornadaID) {
  const contenidor = document.getElementById("contingut");
  const jornada = dadesApp.jornades.find(
    j => j.JornadaID === jornadaID
  );

  if (!contenidor || !jornada) return;

  contenidor.replaceChildren();

  const tornar = document.createElement("button");
  tornar.textContent = "← Tornar a jornades";
  tornar.className = "card";
  tornar.addEventListener("click", mostrarJornades);
  contenidor.appendChild(tornar);

  const titol = document.createElement("h2");
  titol.textContent = jornada.Nom;
  contenidor.appendChild(titol);

  const seus = dadesApp.seus
    .filter(seu => seu.JornadaID === jornadaID)
    .sort((a, b) => a.Data.localeCompare(b.Data));

  if (seus.length === 0) {
    const avis = document.createElement("p");
    avis.className = "estat";
    avis.textContent = "Encara no hi ha seus programades.";
    contenidor.appendChild(avis);
    return;
  }

  let dataAnterior = "";

  seus.forEach(seu => {
    if (seu.Data !== dataAnterior) {
      const data = document.createElement("h3");
      data.textContent = formatData(seu.Data);
      contenidor.appendChild(data);
      dataAnterior = seu.Data;
    }

    
    const targeta = document.createElement("button");
    targeta.type = "button";
    targeta.className = "card";
    
    targeta.addEventListener("click", () => {
      mostrarPartits(seu.SeuID);
    });
    
    const nom = document.createElement("h3");
    nom.textContent = seu.NomSeu;

    const camp = document.createElement("p");
    camp.textContent = seu.Camp || "Camp pendent";

    targeta.appendChild(nom);
    targeta.appendChild(camp);
    contenidor.appendChild(targeta);
  });
}


function mostrarPartits(seuID) {
  const contenidor = document.getElementById("contingut");
  const seu = dadesApp.seus.find(s => s.SeuID === seuID);

  if (!contenidor || !seu) return;

  contenidor.replaceChildren();

  const tornar = document.createElement("button");
  tornar.type = "button";
  tornar.className = "card";
  tornar.textContent = "← Tornar a les seus";
  tornar.addEventListener("click", () => {
    mostrarSeus(seu.JornadaID);
  });
  contenidor.appendChild(tornar);

  const titol = document.createElement("h2");
  titol.textContent = seu.NomSeu;
  contenidor.appendChild(titol);

  const info = document.createElement("p");
  info.className = "estat";
  info.textContent =
    formatData(seu.Data) + " · " + (seu.Camp || "Camp pendent");
  contenidor.appendChild(info);

  const partits = dadesApp.partits
    .filter(p => p.SeuID === seuID)
    .sort((a, b) => String(a.Hora).localeCompare(String(b.Hora)));

  if (partits.length === 0) {
    const avis = document.createElement("p");
    avis.className = "estat";
    avis.textContent = "Encara no hi ha partits programats.";
    contenidor.appendChild(avis);
    return;
  }

  partits.forEach(partit => {
    const equipA = dadesApp.equips.find(
      e => e.EquipID === partit.EquipA_ID
    );

    const equipB = dadesApp.equips.find(
      e => e.EquipID === partit.EquipB_ID
    );

    const nomA = equipA?.NomCurt || partit.EquipA_ID;
    const nomB = equipB?.NomCurt || partit.EquipB_ID;

    const targeta = document.createElement("div");
    targeta.className = "card";

    const nom = document.createElement("h3");
    nom.textContent = nomA + " vs " + nomB;

    const detall = document.createElement("p");
    detall.textContent =
      (partit.Hora || "Hora pendent") +
      " · " +
      (partit.Camp || "Camp pendent");

    targeta.appendChild(nom);
    targeta.appendChild(detall);

    if (
      partit.PuntsA !== "" &&
      partit.PuntsA != null &&
      partit.PuntsB !== "" &&
      partit.PuntsB != null
    ) {
      const marcador = document.createElement("p");
      marcador.textContent =
        "Resultat: " + partit.PuntsA + " - " + partit.PuntsB;
      targeta.appendChild(marcador);
    }

    contenidor.appendChild(targeta);
  });
}

/**
 * Inicialitza l'aplicació.
 */
async function iniciarApp() {
  mostrarEstat("Carregant jornades...");

  try {  
    const [jornades, seus, partits, equips] =
      await Promise.all([
        consultarAPI("Jornades"),
        consultarAPI("Seus"),
        consultarAPI("Partits"),
        consultarAPI("Equips"),
        consultarAPI("Classificacio")
      ]);
    
    dadesApp.jornades = jornades;
    dadesApp.seus = seus;
    dadesApp.partits = partits;
    dadesApp.equips = equips;
    dadesApp.classificacio = classificacio;
    
    mostrarJornades();
      } catch (error) {
    
    console.error(error);
    mostrarEstat(
      "No s'han pogut carregar les jornades.",
      true
    );
  }
}

document.addEventListener(
  "DOMContentLoaded",
  iniciarApp
);
