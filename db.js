const mongoose = require('mongoose')

mongoose.connect('mongodb://localhost:27017/krisha', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("Connected to database"))
.catch((err) => console.log(err))
