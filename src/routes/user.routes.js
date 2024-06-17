import { Router } from "express";
import {changeCurrentPassword, getCurrentUser, loginUser, logoutUser, registerUser, updateAccountDetails} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    registerUser
)
router.route("/login").post(
    loginUser
)
router.route("/logout").post(
    verifyJWT, logoutUser
)
router.route("/changePassword").post(
    verifyJWT, changeCurrentPassword
)
router.route("/currentUser").post(
    verifyJWT,getCurrentUser
)
router.route("/updateAccountDetails").post(
    verifyJWT,updateAccountDetails
)

export default router