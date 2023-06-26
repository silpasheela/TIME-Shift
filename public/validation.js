function nameValidate() {
    let name = document.getElementById("name").value;
    if (name == "") {
      document.getElementById("Name").innerHTML = "Please enter name";
      return false
    } else {
      document.getElementById("Name").innerHTML = "";
      return true
    }
  }
  function emailValidate() {
    let emailId = document.getElementById("email").value;
    console.log("emailId" + emailId);
    if (/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(emailId) == false) {
      document.getElementById("Email").innerHTML = "Please enter valid email ";
      return false;
    } else {
      document.getElementById("Email").innerHTML = "";
      return true;
    }
  }
  function numberValidate() {
    let number = document.getElementById("number").value;
    if (/^[0-9]+$/.test(number) == false) {
      document.getElementById("Number").innerHTML = "Please enter a valid number";
      return false
    }
    else if (number.length != 10) {
      document.getElementById("Number").innerHTML = "Please enter 10 digits";
      return false
    } else {
      document.getElementById("Number").innerHTML = "";
      return true
    }
  }
  let password = document.getElementById("password").value;
  function passwordValidate() {
    password = document.getElementById("password").value;
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const symbolRegex = /[!@#$%^&*()\-=_+[\]{};':"\\|,.<>/?]/;
    const numericRegex = /[0-9]/;
  
    if (password.length < 8) {
        document.getElementById("Password").innerHTML = "Please enter a minimum of 8 characters";
        return false;
    } else if (!uppercaseRegex.test(password)) {
        document.getElementById("Password").innerHTML = "Please include at least one uppercase letter";
        return false;
    } else if (!lowercaseRegex.test(password)) {
        document.getElementById("Password").innerHTML = "Please include at least one lowercase letter";
        return false;
    } else if (!symbolRegex.test(password)) {
        document.getElementById("Password").innerHTML = "Please include at least one symbol";
        return false;
    } else if (!numericRegex.test(password)) {
        document.getElementById("Password").innerHTML = "Please include at least one numeric character";
        return false;
    } else {
        document.getElementById("Password").innerHTML = "";
        return true;
    }
  }

  function passwordValidate2() {
    let password2 = document.getElementById("password2").value;
    console.log(password2)
    if (password2 != password || password2 == "") {
      document.getElementById("Password2").innerHTML = "Password doesn't match";
      return false
    } else {
      document.getElementById("Password2").innerHTML = "";
      return true
    }
  }



  function validate() {
    if (nameValidate() && emailValidate() && numberValidate() && passwordValidate() && passwordValidate2()) {
      return true

    } else {
      return false
    }
  }
  function allChecking() {
    if (emailValidate() && passwordValidate()) {
      return true
    } else {
      return false
    }
  }