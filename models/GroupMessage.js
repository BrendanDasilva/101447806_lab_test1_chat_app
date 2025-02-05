const mongoose = require("mongoose");

const GroupMessageSchema = new mongoose.Schema({
  from_user: { type: String, required: true },
  room: { type: String, required: true },
  message: { type: String, required: true },
  data_sent: { type: Date, default: Date.now },
});

module.exports = mongoose.model("GroupMessage", GroupMessageSchema);
