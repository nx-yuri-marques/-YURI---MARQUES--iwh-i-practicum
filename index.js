const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const HUBSPOT_TOKEN = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
const CUSTOM_OBJECT_ID = process.env.HUBSPOT_CUSTOM_OBJECT_ID;
const PROP_2 = process.env.HUBSPOT_PROP_2;
const PROP_3 = process.env.HUBSPOT_PROP_3;
const PROP_NX = process.env.HUBSPOT_PROP_NX; // Mapeamento da nova propriedade
const OBJECT_LABEL = process.env.HUBSPOT_OBJECT_LABEL || "Custom Objects";

app.set("view engine", "pug");

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const requiredEnvVars = {
  HUBSPOT_PRIVATE_APP_TOKEN: HUBSPOT_TOKEN,
  HUBSPOT_CUSTOM_OBJECT_ID: CUSTOM_OBJECT_ID,
  HUBSPOT_PROP_2: PROP_2,
  HUBSPOT_PROP_3: PROP_3,
  HUBSPOT_PROP_NX: PROP_NX, // Adicionado na validação
};

for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const hubspotHeaders = {
  Authorization: `Bearer ${HUBSPOT_TOKEN}`,
  "Content-Type": "application/json",
};

app.get("/", async (req, res) => {
  try {
    // Adicionado PROP_NX à lista de propriedades buscadas na API
    const properties = ["name", PROP_2, PROP_3, PROP_NX].join(",");

    const response = await axios.get(
      `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_ID}?properties=${properties}`,
      { headers: hubspotHeaders }
    );

    res.render("homepage", {
      title: `${OBJECT_LABEL} | Integrating With HubSpot I Practicum`,
      objectLabel: OBJECT_LABEL,
      prop2: PROP_2,
      prop3: PROP_3,
      propNx: PROP_NX, // Passando para o template da homepage
      records: response.data.results,
    });
  } catch (error) {
    console.error("Error loading HubSpot records:");
    console.error(error.response?.data || error.message);
    res.status(500).send("Error loading HubSpot custom object records.");
  }
});

app.get("/update-cobj", (req, res) => {
  res.render("updates", {
    title: "Update Custom Object Form | Integrating With HubSpot I Practicum",
    objectLabel: OBJECT_LABEL,
    prop2: PROP_2,
    prop3: PROP_3,
    propNx: PROP_NX, // Passando para o template do formulário
  });
});

app.post("/update-cobj", async (req, res) => {
  try {
    // Capturando o valor enviado pelo formulário do Pug
    const { name, prop2Value, prop3Value, propNxValue } = req.body;

    if (!name || !prop2Value || !prop3Value || !propNxValue) {
      return res.status(400).send("All form fields are required.");
    }

    await axios.post(
      `https://api.hubapi.com/crm/v3/objects/${CUSTOM_OBJECT_ID}`,
      {
        properties: {
          name: name,
          [PROP_2]: prop2Value,
          [PROP_3]: prop3Value,
          [PROP_NX]: propNxValue, // Enviando dinamicamente para a HubSpot
        },
      },
      { headers: hubspotHeaders }
    );

    res.redirect("/");
  } catch (error) {
    console.error("Error creating HubSpot record:");
    console.error(error.response?.data || error.message);
    res.status(500).send("Error creating HubSpot custom object record.");
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});