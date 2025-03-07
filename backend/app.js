const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser")
const Doctor = require("./models/doctorModel");
const Patient = require("./models/patientModel");
const dbConnect = require("./utils/dbConnect");
const cors = require("cors");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const reviewRoutes= require("./routes/reviewRoutes");

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
// const dbConnect = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
//     console.log("MongoDB connected!");
//   } catch (err) {
//     console.error("DB connection error:", err);
//     process.exit(1); // Stop server if DB fails
//   }
// };

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

//doctor update
app.post("/update/:email", async function (req, res) {
  const doctor = await Doctor.findOne({email: req.params.email});
  if(!doctor){
    // return res.send(404).json({"error":"Doctor not found"});
    return res.status(404).json({ "error": "Doctor not found" });

  }
  const updated={
        name: req.body.name??doctor.name,
        age: req.body.age??doctor.age,
        domain: req.body.domain??doctor.domain,
        experience: req.body.experience??doctor.experience,
        qualifications: req.body.qualifications??doctor.qualifications,
        location: req.body.location??doctor.location,
        hours: req.body.hours??doctor.hours,
        picturePath:req.body.picturePath??doctor.picturePath,
      };
  const doctor1=await Doctor.findOneAndUpdate({ email: req.params.email },
        { $set: updated },
        { new: true });

  res.json(doctor1);
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
  try{
  console.log(req.params.email);
  const emailid=req.params.email;
  const patient = await Patient.findOne(
    {
      email: emailid,
    });
    console.log(patient);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const updated=
    {
        name: req.body.name??patient.name,
        age: req.body.age??patient.age,
        gender: req.body.gender??patient.gender,
        height: req.body.height??patient.height,
        weight: req.body.weight??patient.weight,
        bloodGroup: req.body.bloodGroup??patient.bloodGroup,
        conditions: req.body.conditions??patient.conditions,
        picturePath:req.body.picturePath??patient.picturePath,
      };
    const patient1=await Patient.findOneAndUpdate({ email: req.params.email },
      { $set: updated },
      { new: true });
  console.log(patient1); 
  res.json(patient1);}
  catch(error){
    console.log("error");
    res.send(500).json({"error":error});
  }
});

// add prescription
app.patch("/addPrescription/:email", async function (req, res) {

  try {
    const email = req.params.email;
    const { date, medicine, duration, amount, current } = req.body;

    const newPrescription = {
      date,
      medicine,
      duration,
      amount,
      doctor: current,
      status: "active"
    }

    const updatedPatient = await Patient.findOneAndUpdate(
      { email: email },
      { $push: { prescriptions: newPrescription } },  
      { new: true }
    ); 
    
    console.log(updatedPatient.prescriptions);
    res.json(updatedPatient);
  } catch (error) {
    console.log("here is an error lmao ", error);
    res.send("there has been an error");
  }
})

// delete prescription
app.patch("/deletePrescription", async function (req, res) {
  const email = req.body.email;
  const prescription_id_objectId = new mongoose.Types.ObjectId(req.body.prescriptionId);
  const curr_user = req.body.curr_user;

  if (email == curr_user) {
    const deletedPrescription = await Patient.updateOne({
      email: email,
    }, {
      $pull: { prescriptions: {_id: prescription_id_objectId}}
    })
    return res.json({deleted: true});  
  }

  const deletedPrescription = await Patient.updateOne({
    email: email,
  }, {
    $pull: { prescriptions: {_id: prescription_id_objectId, doctor: curr_user}}
  })
  console.log(deletedPrescription);
  if (deletedPrescription.modifiedCount == 0) {
    return res.json({deleted: false});
  }
  res.json({deleted: true});  
  }
  )
  
//edit prescription
app.patch("/editPrescription", async function (req, res) {
  const email = req.body.email;
  const prescription_id = new mongoose.Types.ObjectId(req.body.prescriptionId);
  //since the edit button is available to only that person who has created the prescription, we don't need to check here
  // console.log(req.body);
  
    const curr_patient = await Patient.findOne({email: email});
    for (let i = 0; i < curr_patient.prescriptions.length; i++) {
      if (curr_patient.prescriptions[i]._id.equals(prescription_id)) {

        curr_patient.prescriptions[i].date = req.body.date || curr_patient.prescriptions[i].date;
        curr_patient.prescriptions[i].medicine = req.body.medicine || curr_patient.prescriptions[i].medicine;
        curr_patient.prescriptions[i].duration = req.body.duration || curr_patient.prescriptions[i].duration;
        curr_patient.prescriptions[i].amount = req.body.amount || curr_patient.prescriptions[i].amount;
        curr_patient.prescriptions[i].status = req.body.status || curr_patient.prescriptions[i].status;
        
        break; 
      }
    }
    curr_patient.save();
    res.json({"edited": true});     
  }
)



// CHAT ROUTES

app.use("/conversations", conversationRoutes);
app.use("/messages", messageRoutes);
app.use("/rating",reviewRoutes);

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

const PORT = process.env.PORT || 5000;
// const PORT = process.env.PORT || 5002;
server.listen(PORT, function (req, res) {
  console.log(`Server running on port ${PORT}.`);
});
app.get("/", (req, res) => {
  res.send("Server is running!");
});
