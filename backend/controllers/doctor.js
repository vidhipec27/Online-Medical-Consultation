const Doctor = require("../models/doctorModel");
const RequestModel = require("../models/requestModel"); 
const getDoctor= async function (req, res) {
    const doctors = await Doctor.find({});
    res.json({ data: doctors });
  };
  
  const getDoctorEmail= async function (req, res) {
    const email = req.params.email;
    const doctor = await Doctor.findOne({ email: email });
    res.json(doctor);
  };
  
  const createDoctor= async function (req, res) {
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
  };
  
  const createDoctorEmail= async function (req, res) {
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
  };
  
  //doctor update
  const updateDoctor= async function (req, res) {
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
  };

  const getAllRequests = async (req, res) => {
    try {
        const { doctorEmail } = req.params; // Get doctor email from URL parameter

        if (!doctorEmail) {
            return res.status(400).json({ message: "Doctor email is required." });
        }

        // Find all requests for the given doctor email
        const requests = await RequestModel.find({ doctorEmail });

        if (requests.length === 0) {
            return res.status(404).json({ message: "No requests found for this doctor." });
        }

        return res.status(200).json({ requests });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};
const updateRequest = async (req, res) => {
  try {
    console.log("Received update request:", req.body);

    const { doctorEmail, patientEmail, status } = req.body;

    if (!doctorEmail || !patientEmail || !status) {
      return res.status(400).json({ message: "Doctor email, patient email, and status are required." });
    }

    const request = await RequestModel.findOneAndUpdate(
      { doctorEmail, patientEmail },
      { status },
      { new: true }
    );

    if (!request) {
      console.log("Request not found:", { doctorEmail, patientEmail });
      return res.status(404).json({ message: "No request found to update." });
    }

    console.log("Request updated successfully:", request);
    return res.status(200).json({ message: "Request updated successfully.", request });

  } catch (error) {
    console.error("Error in updateRequest:", error);
    return res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};


module.exports={updateRequest,getAllRequests,getDoctor,getDoctorEmail,createDoctor,createDoctorEmail,updateDoctor};
  