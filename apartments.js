const mongoose = require('mongoose')
const ApartmentsSchema = new mongoose.Schema(
    {
        id: {
            type: Number,
            required: true
        },
        view: {
            type: Number
        },
        city: {
            type: String,
        },
        street: {
            type: String
        },
        url: {
            type: String,
        },
        phone: {
            type: String,
            default:null
        },
        price: {
            type: String
        },
        date: {
            type: Date
        },


        microdistrict: {
            type: String
        },
        room: {
          type: String
        },
        duration: {
            type: String
        },
        dom: {
            type: String
        },
        floor: {
            type: String
        },
        area: {
            type: String
        },
        condition: {
            type: String
        },
        residential_complex: {
            type: String
        },
        bathroom: {
            type: String
        },
        balcony: {
            type: String
        },
        balcony_osteklen: {
            type: String
        },
        internet: {
            type: String
        },
        mebel: {
            type: String
        },
        door: {
            type: String
        },
        pol: {
            type: String
        },
        potolki: {
            type: String
        },
        safe: {
            type: String
        },
        parking: {
            type: String
        },
        type: {
            type: String,
            default: 'Квартиры'
        },
        district: {
            type: String
        }
    }
)

module.exports = mongoose.model('apartments', ApartmentsSchema);
