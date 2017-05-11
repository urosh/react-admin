const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SettingsSchema = new Schema({
	serverID: String
});

module.exports = mongoose.model('Settings', SettingsSchema);
