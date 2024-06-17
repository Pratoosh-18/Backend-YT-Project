import { User } from "../models/user.model.js"

const getRefereshAndAccessToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }


    } catch (error) {
        throw new Error('Token generation went wrong', { statusCode: 404 })
    }
}

const registerUser = async (req, res) => {
    /*{
    REGISTERING THE USER ->
    -> get the user details (username,email,fullname,avatar,coverimage,password)
    -> validations
    -> verify if the user exists
    -> check for the avatar and uplaod on cloudinary
    -> create user object (to send on mongo)
    -> create entry on db
    -> remove password , referesh token etc from response
    -> check the response (user creation)
    -> return response 
    }*/
    const { username, email, fullname, password } = req.body
    console.log(username, email, fullname, password)

    // Validations
    if (username === undefined) {
        throw new Error('Username is not defined', { statusCode: 404 })
    }
    if (email === undefined) {
        throw new Error('Email is not defined', { statusCode: 404 })
    }
    if (fullname === undefined) {
        throw new Error('Fullname is not defined', { statusCode: 404 })
    }
    if (password === undefined) {
        throw new Error('Password is not defined', { statusCode: 404 })
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new Error('Username or email already exist', { statusCode: 404 })
    }
    //console.log(req.files);

    const user = await User.create({
        fullname,
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refershToken"
    )
    if (!createdUser) {
        throw new Error('Something went wrong registering the user', { statusCode: 500 })
    }
    return res.status(200).json({ createdUser })

}

const loginUser = async (req, res) => {
    /*{
    LOGIN THE USER ->
    -> get the details from the user
    -> authentication
    -> check if the user exists
    -> password check
    -> access refresh token
    -> cookies
    -> login 
    }*/
    const { username, email, password } = req.body
    if (!username && !email) {
        throw new Error('At least one field is required', { statusCode: 404 })
    }
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (!user) {
        throw new Error('User does not exist', { statusCode: 404 })
    }

    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new Error('Incorrect password', { statusCode: 404 })
    }

    const { accessToken, refreshToken } = await getRefereshAndAccessToken(user._id)

    const loggedInUser = await User.findById(user._id)

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(loggedInUser)
}

const logoutUser = async (req, res) => {
    const luser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(luser)
}

// const refreshAccessToken = async (req,res) => {
//     const incomingRefreshToken = req.cookies.refreshtoken || req.body.refreshToken

//     if (!incomingRefreshToken) {
//         throw new Error('token not found', { statusCode: 404 })
//     }

//     const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

//     const user = await User.findById(decodedToken?._id)

//     if (!user) {
//         throw new Error('User not found', { statusCode: 404 })
//     }

//     if (incomingRefreshToken !== user?.refreshToken) {
//         throw new Error('refresh token does not match', { statusCode: 404 })
//     }
//     const options = {
//         httpOnly: true,
//         secure: true
//     }

//     const { accessToken, refreshToken } = getRefereshAndAccessToken(user._id)

//     return res.status(200)
//         .cookie("accessToken", accessToken, options)
//         .cookie("refreshToken", refreshToken, options)
//         .json(user)
// }

const changeCurrentPassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body

    const user = await User.findById(req.user?._id)

    const isPassCorrect = await user.isPasswordCorrect(oldPassword)
    // console.log(isPassCorrect)

    if (!isPassCorrect) {
        throw new Error('Invalid old password', { statusCode: 404 })
    }   

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    const changedUser = await User.findById(req.user?._id)

    return res.status(200)
    .json(changedUser)
}

const getCurrentUser = async (req, res) => {
    return res.status(200)
        .json(req.user)
}

const updateAccountDetails = async (req, res) => {
    const { fullname, email } = req.body

    if (!fullname || !email) {
        throw new Error('fullname and email both are required', { statusCode: 404 })
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email
            }
        },
        { new: true }
    ).select("-password")

    return res.status(200)
        .json(user)
}

export { registerUser, loginUser, logoutUser, changeCurrentPassword, getCurrentUser, updateAccountDetails } 