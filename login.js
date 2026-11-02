/* =========================================================
   RI STUDENT ENVIRONMENT
   Login
   ========================================================= */


/* =========================================================
   LOGIN
   ========================================================= */

async function handleLogin(event) {

    event.preventDefault();

    console.log("LOGIN: FORM SUBMIT FIRED");

    const form = event.currentTarget;

    const emailInput =
        form.querySelector("#student-email");

    const passwordInput =
        form.querySelector("#password");

    const email =
        emailInput
            ? emailInput.value.trim()
            : "";

    const password =
        passwordInput
            ? passwordInput.value
            : "";

    console.log("LOGIN: VALUES READ", {
        email,
        passwordLength: password.length
    });


    if (!email || !password) {

        alert(
            "Please enter your email and password."
        );

        return;
    }


    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {

        submitButton.disabled = true;
        submitButton.textContent = "Logging in...";

    }


    try {

        console.log(
            "LOGIN: API CALL MADE"
        );


        const response =
            await RI_API.post(
                "/api/students/login",
                {
                    email,
                    password
                }
            );


        console.log(
            "LOGIN: API RESPONSE RECEIVED",
            response
        );


        const token =
            response.token;

        const student =
            response.student;


        if (!token) {

            throw new Error(
                "The server did not return a login token."
            );

        }


        if (!student) {

            throw new Error(
                "The server did not return student information."
            );

        }


        /* Save authentication */

        saveToken(token);
        saveStudent(student);


        console.log(
            "LOGIN: TOKEN SAVED",
            getToken()
                ? "TOKEN EXISTS"
                : "NO TOKEN"
        );


        console.log(
            "LOGIN: STUDENT SAVED",
            {
                student_id: student.student_id,
                role: student.role
            }
        );


        /* Role-based redirect */

        if (student.role === "admin") {

            console.log(
                "LOGIN: REDIRECT → ADMIN"
            );

            window.location.href =
                "admin.html";

            return;
        }


        if (student.role === "src") {

            console.log(
                "LOGIN: REDIRECT → SRC"
            );

            window.location.href =
                "src-dashboard.html";

            return;
        }


        console.log(
            "LOGIN: REDIRECT → STUDENT"
        );

        window.location.href =
            "dashboard.html";


    } catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        alert(
            error.message ||
            "Login failed."
        );


        if (submitButton) {

            submitButton.disabled = false;
            submitButton.textContent = "login";

        }

    }

}


/* =========================================================
   LOGIN PAGE INITIALISATION
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const loginForm =
            document.querySelector(
                ".login-form"
            );


        if (!loginForm) {

            console.error(
                "LOGIN: FORM NOT FOUND"
            );

            return;
        }


        loginForm.addEventListener(
            "submit",
            handleLogin
        );


        console.log(
            "LOGIN: HANDLER ATTACHED"
        );

    }
);
