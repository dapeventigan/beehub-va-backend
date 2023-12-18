const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const path = require("path"); // Import the 'path' module
const http = require("http");
const { Server } = require("socket.io");
//utils
const verifyEmail = require("./utils/verifyEmail");
const resetPassword = require("./utils/resetPassword");
const contactEmail = require("./utils/contactEmail");
const welcomeEmail = require("./utils/welcomeEmail");
const welcomeJoinEmail = require("./utils/welcomeJoinEmail");
require("dotenv").config();

//middlewares
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://beehubvas.com",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
    optionsSuccessStatus: 200,
  },
});
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: "https://beehubvas.com",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Authorization",
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "https://beehubvas.com");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next();
});
app.use("/resumes", express.static(path.join(__dirname, "resumes")));

mongoose.connect(process.env.DB, {
  useNewUrlParser: true,
});

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

//MODELS
const UserModel = require("./models/userSchema");
const VerifyUserModel = require("./models/verifyUserSchema");

//MULTER
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./resumes");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now();
    cb(null, uniqueSuffix + file.originalname);
  },
});

const upload = multer({ storage: storage });

//POST

// app.post("/applyRegister", upload.single("pdfFile"), async (req, res) => {
//   const fileName = req.file.filename;
//   const password = req.body.password;
//   const roleStatus = "applyUser";
//   const encryptedPassword = await bcrypt.hash(password, 10);

//   let user = await UserModel.findOne({ email: req.body.email });
//   if (user) {
//     return res.send("Email Already Exist!");
//   }

//   user = await new UserModel({
//     ...req.body,
//     pdfFile: fileName,
//     role: roleStatus,
//     password: encryptedPassword,
//   }).save();

//   const userVerify = await new VerifyUserModel({
//     userId: user._id,
//     uniqueString: crypto.randomBytes(32).toString("hex"),
//   }).save();
//   const urlVerify = `https://beehubvas.com/verify/${user._id}/${userVerify.uniqueString}`;
//   await verifyEmail(req.body.email, urlVerify);

//   res.status(200).send({
//     message: "Email sent, check your mail.",
//     user: user,
//   });
// });

// app.post("/joinRegister", upload.single("pdfFile"), async (req, res) => {
//   const password = req.body.password;
//   const roleStatus = "joinUser";
//   const encryptedPassword = await bcrypt.hash(password, 10);

//   let user = await UserModel.findOne({ email: req.body.email });
//   if (user) {
//     return res.send("Email Already Exist!");
//   }

//   user = await new UserModel({
//     ...req.body,
//     role: roleStatus,
//     password: encryptedPassword,
//   }).save();

//   const userVerify = await new VerifyUserModel({
//     userId: user._id,
//     uniqueString: crypto.randomBytes(32).toString("hex"),
//   }).save();
//   const urlVerify = `https://beehubvas.com/verify/${user._id}/${userVerify.uniqueString}`;
//   await verifyEmail(req.body.email, urlVerify);

//   res.status(200).send({
//     message: "Email sent, check your mail.",
//     user: user,
//   });
// });

// app.post("/joinRegister", upload.single("pdfFile"), async (req, res) => {
//   const password = "OFWGKTA02!";
//   const roleStatus = "joinUser";
//   const encryptedPassword = await bcrypt.hash(password, 10);
//   console.log(encryptedPassword)

//   let user = await UserModel.findOne({
//     email: req.body.email,
//     contacted: false,
//   });
//   if (user) {
//     res.send({ message: "Email Already Exist!" });
//     const roleStatus = "";
//   } else {
//     user = await new UserModel({
//       ...req.body,
//       role: roleStatus,
//     }).save();

//     // await welcomeJoinEmail(
//     //   req.body.email,
//     //   req.body.fname,
//     //   req.body.selectedValues
//     // );

//     res.status(200).send({
//       message: "Email sent, check your mail.",
//       user: user,
//     });
//   }
// });

io.on("connection", (socket) => {
  socket.on("new_user", (data) => {
    socket.broadcast.emit("senduser_admin", data);
  });
});

app.post("/applyRegister", upload.single("pdfFile"), async (req, res) => {
  const fileName = req.file.filename;
  const roleStatus = "applyUser";

  let user = await UserModel.findOne({
    email: req.body.email,
    contacted: false,
  });

  if (user) {
    res.send({ message: "Email Already Exist!" });
    const fileName = null;
    const roleStatus = "";
  } else {
    user = await new UserModel({
      ...req.body,
      pdfFile: fileName,
      role: roleStatus,
    }).save();

    await welcomeEmail(
      req.body.email,
      req.body.fname,
      req.body.selectedValues,
      fileName
    );

    res.status(200).send({
      message: "Email sent, check your mail.",
      user: user,
    });
  }
});

app.post("/joinRegister", upload.single("pdfFile"), async (req, res) => {
  const roleStatus = "joinUser";

  let user = await UserModel.findOne({
    email: req.body.email,
    contacted: false,
  });
  if (user) {
    res.send({ message: "Email Already Exist!" });
    const roleStatus = "";
  } else {
    user = await new UserModel({
      ...req.body,
      role: roleStatus,
    }).save();

    await welcomeJoinEmail(
      req.body.email,
      req.body.fname,
      req.body.selectedValues
    );

    res.status(200).send({
      message: "Email sent, check your mail.",
      user: user,
    });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email: email });

  if (!user) {
    return res.status(400).send({
      message: `Email doesn't exist!`,
    });
  }
  if (await bcrypt.compare(password, user.password)) {
    if (!user.verified) {
      const token = await VerifyUserModel.findOne({ userId: user._id });
      if (!token) {
        const userVerify = await new VerifyUserModel({
          userId: user._id,
          uniqueString: crypto.randomBytes(32).toString("hex"),
        }).save();
        const urlVerify = `https://beehubvas.com/verify/${user._id}/${userVerify.uniqueString}`;
        await verifyEmail(req.body.email, urlVerify);
      }

      return res.status(400).send({
        message: `An verification link was sent to ${req.body.email}. Please verify your account.`,
      });
    } else {
      const token = jwt.sign(
        { email: user.email, role: user.role, userID: user._id },
        process.env.JWT_SECRET,
        {
          expiresIn: "1d",
        }
      );

      res.cookie("token", token, {
        httpOnly: true,
        secure: true, // Set to true if your application is served over HTTPS
        sameSite: "None",
        maxAge: 24 * 60 * 60 * 1000,
      });

      if (res.status(201)) {
        return res.json({
          status: "ok",
          role: user.role,
          token: token,
        });
      } else {
        return res.json({ status: "error" });
      }
    }
  }
  return res.status(400).send({
    message: `Invalid Password!`,
  });
});

app.post("/logout", async (req, res) => {
  res.clearCookie("token", {
    domain: "dape-beehub-va-api.onrender.com",
    path: "/", // Path should match the original cookie setting
    secure: true, // Set to true if the cookie was set with the secure flag
    httpOnly: true,
    sameSite: "none", // Set to 'None' if the cookie was set with SameSite=None
  });

  res.clearCookie("token");

  res.send("Token cookie deleted");
});

app.post("/getEmail", async (req, res) => {
  let user = await UserModel.findOne({ email: req.body.email });
  if (user) {
    const userVerify = await new VerifyUserModel({
      userId: user._id,
      uniqueString: crypto.randomBytes(32).toString("hex"),
    }).save();
    const urlVerify = `https://beehubvas.com/reset/${user._id}/${userVerify.uniqueString}`;
    await resetPassword(req.body.email, urlVerify);
  } else {
    res.status(400).send({
      message: "Email is not registered or it doesn't exist.",
    });
  }
});

app.post("/resetPassword", upload.single("pdfFile"), async (req, res) => {
  const newPassword = req.body.password;
  const encryptedPassword = await bcrypt.hash(newPassword, 10);
  const userID = req.body.userID;
  try {
    await UserModel.updateOne({ _id: userID }, { password: encryptedPassword });
  } catch (error) {
    res
      .status(200)
      .send({ message: "Change password unsuccessful. Please try again." });
  }
});

app.post("/contactMessage", async (req, res) => {
  const email = req.body.email;
  const message = req.body.message;
  const subject = req.body.subject;
  const id = req.body.id;

  await contactEmail(email, subject, message);
  await UserModel.updateOne({ _id: id }, { archive: true });
});

//GET
app.get("/verify/:id/:token", async (req, res) => {
  const userId = await VerifyUserModel.findOne({ userId: req.params.id });

  if (!userId) {
    res.send({
      message: "Link expired or Invalid token. Please try again by logging in.",
    });
  } else {
    const token = await VerifyUserModel.findOne({
      uniqueString: req.params.token,
    });
    res.send({ message: "Valid Link" });

    if (!token) {
      console.log("Invalid token");
    } else {
      await UserModel.updateOne(
        { _id: token.userId },
        { $set: { verified: true } }
      );
      await VerifyUserModel.findByIdAndRemove(token._id);
    }
  }
});

app.get("/reset/:id/:token", async (req, res) => {
  const userId = await VerifyUserModel.findOne({ userId: req.params.id });
  if (!userId) {
    res.send({ message: "nah" });
  } else {
    const token = await VerifyUserModel.findOne({
      uniqueString: req.params.token,
    });
    res.send({ message: "yeah" });
    if (!token) {
      console.log("Invalid token");
    } else {
      await VerifyUserModel.findByIdAndRemove(token._id);
    }
  }
});

const verifyLoginUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    const tokenkey = "No token found";
    req.tokenkey = tokenkey;
    next();
  } else {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.json(err);
      } else {
        if (
          decoded.role === "admin" ||
          decoded.role === "applyUser" ||
          decoded.role === "joinUser"
        ) {
          const user = await UserModel.findById(decoded.userID);
          req.user = user;
          next();
        } else {
          const user = await UserModel.findById(decoded.userID);
          req.user = user;
          next();
        }
      }
    });
  }
};

app.get("/verifylogin", verifyLoginUser, (req, res) => {
  const user = req.user;
  const tokenVerify = req.tokenkey;
  if (tokenVerify == "No token found") {
    res.json("User not found");
  } else {
    res.json(user);
  }
});

const verifyAdminUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    const tokenkey = "No token found";
    req.tokenkey = tokenkey;
    next();
  } else {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.json("Error with token");
      } else {
        if (decoded.role === "admin") {
          const user = await UserModel.findById(decoded.userID);
          req.user = user;
          next();
        } else {
          const user = await UserModel.findById(decoded.userID);
          req.user = user;
          next();
        }
      }
    });
  }
};

app.get("/admindashboard", verifyAdminUser, (req, res) => {
  const user = req.user;
  const tokenVerify = req.tokenkey;

  if (tokenVerify == "No token found") {
    res.json("User not found");
  } else {
    if (user.role == "admin") {
      res.json(user);
    } else {
      res.json("User not found");
    }
  }
});

const verifyApplyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    const tokenkey = "No token found";
    req.tokenkey = tokenkey;
    next();
  } else {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.json("Error with token");
      } else {
        if (decoded.role === "applyUser") {
          const user = await UserModel.findById(decoded.userID);
          req.user = user;
          next();
        } else {
          const user = await UserModel.findById(decoded.userID);
          req.user = user;
          next();
        }
      }
    });
  }
};

app.get("/applyuserdashboard", verifyApplyUser, (req, res) => {
  const user = req.user;
  const tokenVerify = req.tokenkey;

  if (tokenVerify == "No token found") {
    res.json("User not found");
  } else {
    if (user.role == "applyUser") {
      res.json(user);
    } else {
      res.json("User not found");
    }
  }
});

const verifyJoinUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    const tokenkey = "No token found";
    req.tokenkey = tokenkey;
    next();
  } else {
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.json("Error with token");
      } else {
        if (decoded.role === "joinUser") {
          const user = await UserModel.findById(decoded.userID);
          req.user = user;
          next();
        } else {
          const user = await UserModel.findById(decoded.userID);
          req.user = user;
          next();
        }
      }
    });
  }
};

app.get("/joinuserdashboard", verifyJoinUser, (req, res) => {
  const user = req.user;
  const tokenVerify = req.tokenkey;

  if (tokenVerify == "No token found") {
    res.json("User not found");
  } else {
    if (user.role == "joinUser") {
      res.json(user);
    } else {
      res.json("User not found");
    }
  }
});

app.get("/getSpecificUser", async (req, res) => {
  const user = req.query.userID;
  await UserModel.find({ _id: user })
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      res.send({ message: error });
    });
});

app.get("/getApplyUsers", async (req, res) => {
  const userRole = "applyUser";

  await UserModel.find({ role: userRole, archive: false })
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      res.send({ message: error });
    });
});

app.get("/getJoinUsers", async (req, res) => {
  const userRole = "joinUser";

  await UserModel.find({ role: userRole, archive: false })
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      res.send({ message: error });
    });
});

app.get("/getArchiveUsers", async (req, res) => {
  await UserModel.find({ archive: true })
    .then((data) => {
      res.json(data);
    })
    .catch((error) => {
      res.send({ message: error });
    });
});

app.get("/viewPDF", (req, res) => {
  const pdfFilename = req.query.filename;
  const pdfUrl = `https://dape-beehub-va-api.onrender.com/resumes/${pdfFilename}`;
  res.status(200).send({ url: pdfUrl });
});
