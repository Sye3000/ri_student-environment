/* =========================================================
   RI STUDENT ENVIRONMENT
   Authentication
   ========================================================= */


/* =========================================================
   TOKEN
   ========================================================= */

function getToken() {
    return localStorage.getItem("ri_student_token");
}

function saveToken(token) {
    localStorage.setItem("ri_student_token", token);
}

function removeToken() {
    localStorage.removeItem("ri_student_token");
}


/* =========================================================
   STUDENT
   ========================================================= */

function saveStudent(student) {
    localStorage.setItem(
        "ri_student",
        JSON.stringify(student)
    );
}

function getSavedStudent() {
    const student = localStorage.getItem("ri_student");

    if (!student) {
        return null;
    }

    try {
        return JSON.parse(student);
    } catch (error) {
        console.error(
            "AUTH: Unable to read saved student.",
            error
        );

        return null;
    }
}

function removeStudent() {
    localStorage.removeItem("ri_student");
}


/* =========================================================
   CURRENT USER
   ========================================================= */

async function loadCurrentStudent() {

    const token = getToken();

    console.log(
        "AUTH: TOKEN",
        token ? "TOKEN EXISTS" : "NO TOKEN"
    );

    if (!token) {

        console.log(
            "AUTH: NO TOKEN, REDIRECTING TO LOGIN"
        );

        window.location.href = "login.html";

        return null;
    }

    try {

        const data = await RI_API.get(
            "/api/auth/me",
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        if (!data.student) {
            throw new Error(
                "The server returned incomplete student data."
            );
        }

        saveStudent(data.student);

        console.log(
            "AUTH: CURRENT STUDENT",
            data.student
        );

        return data.student;

    } catch (error) {

        console.error(
            "AUTH: Authentication failed.",
            error
        );

        clearAuthentication();

        window.location.href = "login.html";

        return null;
    }
}


/* =========================================================
   ROLE
   ========================================================= */

async function requireRole(requiredRole) {

    const student = await loadCurrentStudent();

    if (!student) {
        return null;
    }

    if (student.role !== requiredRole) {

        console.warn(
            "AUTH: Incorrect role.",
            {
                required: requiredRole,
                actual: student.role
            }
        );

        if (student.role === "admin") {
            window.location.href = "admin.html";
        } else if (student.role === "src") {
            window.location.href = "src-dashboard.html";
        } else {
            window.location.href = "dashboard.html";
        }

        return null;
    }

    return student;
}


/* =========================================================
   LOGOUT
   ========================================================= */

function logoutStudent(event) {

    if (event) {
        event.preventDefault();
    }

    console.log("AUTH: LOGOUT");

    clearAuthentication();

    window.location.href = "index.html";
}


/* =========================================================
   CLEAR SESSION
   ========================================================= */

function clearAuthentication() {

    removeToken();
    removeStudent();

}
