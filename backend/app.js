const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser")
const Doctor = require("./models/doctorModel");
const Patient = require("./models/patientModel");
const dbConnect = require("./utils/dbConnect");
const cors = require("cors");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
dbConnect();

const corsOptions = {
  origin: "*",
};
app.use(cors(corsOptions));

app.get("/search", async function (req, res) {
  const doctors = await Doctor.find({});
  res.json({ data: doctors });
});

app.get("/search/:email", async function (req, res) {
  const email = req.params.email;
  const doctor = await Doctor.findOne({ email: email });
  res.json(doctor);
})

app.post("/create", async function (req, res) {
  const doctor = new Doctor({
    name: req.body.name,
    age: req.body.age,
    domain: req.body.domain,
    experience: req.body.experience,
    qualifications: req.body.qualifications,
    location: req.body.location,
    hours: req.body.hours,
  });
  await doctor.save();
  res.json(doctor);
});

app.post("/create/:email", async function (req, res) {
  const doctor = new Doctor({
    email: req.params.email,
    name: req.body.name,
    age: req.body.age,
    domain: req.body.domain,
    experience: req.body.experience,
    qualifications: req.body.qualifications,
    location: req.body.location,
    hours: req.body.hours,
    picturePath: req.body.picturePath,
  });
  await doctor.save();
  res.json(doctor);
});

app.post("/update/:email", async function (req, res) {
  const doctor = await Doctor.findOneAndUpdate(
    {
      email: req.params.email,
    },
    {
      $set: {
        name: req.body.name,
        age: req.body.age,
        domain: req.body.domain,
        experience: req.body.experience,
        qualifications: req.body.qualifications,
        location: req.body.location,
        hours: req.body.hours,
      },
    },
    {
      new: true,
    }
  );
  res.json(doctor);
});


// PATIENT ROUTES

// create patient profile
app.post("/patientCreate/:email", async function (req, res) {
  const patient = new Patient({
    email: req.params.email,
    name: req.body.name,
    age: req.body.age,
    gender: req.body.gender,
    height: req.body.height,
    weight: req.body.weight,
    bloodGroup: req.body.bloodGroup,
    conditions: req.body.conditions,
    picturePath: req.body.picturePath,
    prescriptions: [],
  });
  await patient.save();
  res.json(patient);
});

// get patient profile
app.get("/patientProfile/:email", async function (req, res) {
  const email = req.params.email;
  const patient = await Patient.findOne({ email: email });
  res.json(patient);
});


// update patient profile
app.post("/patientUpdate/:email", async function (req, res) {
  const patient = await Patient.findOneAndUpdate(
    {
      email: req.params.email,
    },
    {
      $set: {
        name: req.body.name,
        age: req.body.age,
        gender: req.body.gender,
        height: req.body.height,
        weight: req.body.weight,
        bloodGroup: req.body.bloodGroup,
        conditions: req.body.conditions,
      },
    },
    {
      new: true,
    }
  );
  res.json(patient);
});

// add prescription
app.patch("/addPrescription/:email", async function (req, res) {
  const email = req.params.email;
  const { date, medicine, duration, amount } = req.body;
  const newPrescription = { date, medicine, duration, amount };
  const patient = await Patient.findOne({ email: email });
  patient.prescriptions.push(newPrescription);
  const updatedPatient = await Patient.findOneAndUpdate(
    {
      email: email,
    },
    { prescriptions: patient.prescriptions },
    { new: true }
  );
  res.json(updatedPatient);
})

// delete prescription
app.patch("/deletePrescription/:email/:prescriptionId", async function (req, res) {
  const email = req.params.email;
  const prescription_id = req.params.prescriptionId
  const updatedPatient = await Patient.findOneAndUpdate(
    {
      email: email,
    },
    { $pull: {prescriptions: { _id: prescription_id}}},
    { new: true }
  );
  res.json(updatedPatient);
})



// CHAT ROUTES

app.use("/conversations", conversationRoutes);
app.use("/messages", messageRoutes);





let users = [];

const addUser = (userId, socketId) => {
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId) => {
  return users.find((user) => user.userId === userId);
};

io.on("connection", (socket) => {
  console.log("a user connected.");

  // connection
  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  // send and receive messages
  socket.on("sendMessage", ({ senderId, receiverId, text }) => {
    const user = getUser(receiverId);
    io.to(user?.socketId).emit("getMessage", {
      senderId,
      text,
    });
  });

  // disconnection
  socket.on("disconnect", () => {
    console.log("a user disconnected!");
    removeUser(socket.id);
    io.emit("getUsers", users);
  });
});

const PORT = process.env.PORT || 6050;
server.listen(PORT, function (req, res) {
  console.log(`Server running on port ${PORT}.`);
});