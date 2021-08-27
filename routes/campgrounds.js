const catchAsync = require("../utils/catchAsync")
const {campgroundSchema} = require("../schemas/schemas")
const ExpressError = require("../utils/ExpressError")
const Campground = require("../models/campground");
const express = require('express');
const router = express.Router();

const validateCampground = (req, res, next) => {
    const {error} = campgroundSchema.validate(req.body);
    if(error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

router.get("/", async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index', {campgrounds});
});

router.get("/new", (req, res) => {
    res.render('campgrounds/new');
});

router.get("/:id/edit", async (req, res) => {
    const {id} = req.params;
    const camp = await Campground.findById(id); 
    res.render("campgrounds/edit", {camp});
})

router.get("/:id", catchAsync(async (req, res) => {
    const {id} = req.params;
    const camp = await Campground.findById(id).populate('reviews');
    res.render("campgrounds/show", {camp});
}));

router.post("/", validateCampground,  catchAsync(async (req, res, next) => {
    const campground = new Campground(req.body.campground);
    await campground.save();
    res.redirect(`/campgrounds/${campground._id}`);
}));

router.put("/:id", validateCampground, catchAsync(async(req, res) => {
    const {id} = req.params;
    await Campground.findByIdAndUpdate(id, {...req.body.campground})
    res.redirect(`/campgrounds/${id}`);
})) 

router.delete("/:id", catchAsync(async(req, res) => {
    const {id} = req.params;
    await Campground.findByIdAndDelete(id);
    res.redirect("/campgrounds");
}))

module.exports = router;