const mongoose = require("mongoose");
const prescription = require("./prescriptionModel");

const patientSchema = new mongoose.Schema({
  email: {
    type: String,
  },
  name: {
    type: String,
  },
  age: {
    type: Number,
  },
  gender: {
    type: String,
  },
  height: {
    type: Number,
  },
  weight: {
    type: Number,
  },
  bloodGroup: {
    type: String,
  },
  conditions: {
    type: String,
  },
  picturePath: {
    type: String,
    default: "",
  },
  prescriptions: {
    type: [prescription]
  }
});

const Patient = mongoose.models.Patient || mongoose.model("Patient", patientSchema);

module.exports = Patient;
