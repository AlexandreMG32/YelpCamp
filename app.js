const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const Campground = require("./models/campground");
const Review = require("./models/review")
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate")
const catchAsync = require("./utils/catchAsync")
const {campgroundSchema, reviewSchema} = require("./schemas/schemas")
const ExpressError = require("./utils/ExpressError")

mongoose.connect('mongodb://localhost:27017/yelp-camp', {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology:true
});


const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error"));
db.once("open", () => {
    console.log("Database connected");
});

const app = express();

app.engine("ejs", ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));

const validateCampground = (req, res, next) => {
    const {error} = campgroundSchema.validate(req.body);
    if(error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

const validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body);
    if(error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

app.get('/', (req, res) => {
    res.render('home');
});

app.get("/campgrounds", async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', {campgrounds});
});

app.get("/campgrounds/new", (req, res) => {
    res.render('campgrounds/new');
});

app.get("/campgrounds/:id/edit", async (req, res) => {
    const {id} = req.params;
    const camp = await Campground.findById(id); 
    res.render("campgrounds/edit", {camp});
})

app.post("/campgrounds/:id/reviews", validateReview,  catchAsync(async (req, res) => {
    const {id} = req.params;
    const review = new Review(req.body.review);
    const camp = await Campground.findById(id);
    console.log(camp)
    camp.reviews.push(review);
    await camp.save();
    await review.save();
    res.redirect(`/campgrounds/${id}`)
}))

app.get("/campgrounds/:id", catchAsync(async (req, res) => {
    const {id} = req.params;
    const camp = await Campground.findById(id).populate('reviews');
    res.render("campgrounds/show", {camp});
}));

app.post("/campgrounds", validateCampground,  catchAsync(async (req, res, next) => {
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}));

app.put("/campgrounds/:id", validateCampground, catchAsync(async(req, res) => {
    const {id} = req.params;
    await Campground.findByIdAndUpdate(id, {...req.body.campground})
    res.redirect(`/campgrounds/${id}`);
})) 



app.delete("/campgrounds/:id", catchAsync(async(req, res) => {
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect("/campgrounds");
}))

app.delete("/campgrounds/:id/reviews/:reviewId", catchAsync( async(req, res, next) => {
    const {id, reviewId} = req.params;
    await Review.findByIdAndDelete(reviewId);
    await Campground.findByIdAndUpdate(id, {$pull : {reviews: reviewId}});
    const camp = await Campground.findById(req.params.id);
    res.redirect(`/campgrounds/${id}`)
}))


app.all('*', (req, res, next) => {
    next(new ExpressError("Page Not Found", 404));
})

app.use((err, req, res, next) => {
    const {statusCode = 500} = err;
    if(!err.message) err.message = "Oh no, something went wrong";
    res.status(statusCode).render("error", {err});
})

app.listen(3000, () => {
    console.log("Server running on port 3000");
});