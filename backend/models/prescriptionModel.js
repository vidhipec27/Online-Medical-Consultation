const mongoose = require("mongoose");
const Doctor = require("./doctorModel");
const Patient = require("./patientModel");

const prescriptionSchema = new mongoose.Schema({
    date: {
        type: String,
    },
    medicine: {
        type: String,
    },
    duration: {
        type: String,
    },
    amount: {
        type: String,
    },
    doctor: {
        type: Doctor
    },
    status: {
        type: String
    }
})

const prescription = mongoose.model.Prescription || mongoose.model("Prescription", prescriptionSchema);

