const express = require("express");
const app = express();
const mysql = require("mysql");

var pool = mysql.createConnection({
    host: "********",
    user: "********",
    password: "********",
    database: "********",
});

// 계정 생성
app.post("/sign_up", (req, res) => {
    var inputData;
    req.on("data", (data) => {
        inputData = JSON.parse(data);
    });
    req.on("end", () => {
        // 아이디 중복 확인
        pool.query("select * from User where id='" + inputData.id + "';", function(err, result, fields) {
            if (err) {
                throw err;
            } else {
                if (result[0]) {
                    console.log("아이디가 중복됩니다");
                    res.write("-1", function() {
                        res.end();
                    });
                } else {
                    // DB에 회원 정보 저장
                    pool.query(
                        "INSERT INTO User(id, pw, name) VALUES ('" + inputData.id + "', '" +
                        inputData.pw + "', '" + inputData.name + "');",
                        function(err, result, fields) {
                            if (err) {
                                throw err;
                            } else {
                                console.log("새로운 회원 정보를 DB에 추가했습니다");
                                res.write("0", function() {
                                    res.end();
                                });
                            }
                        }
                    );
                }
            }
        });
    });
});

app.post("/sign_in", (req, res) => {
    var inputData;
    req.on("data", (data) => {
        inputData = JSON.parse(data);
    });
    req.on("end", () => {
        pool.query(
            "select * from User where id='" + inputData.id + "' and pw='" + inputData.pw + "';",
            function(err, result, fields) {
                if (err) {
                    throw err;
                } else {
                    if (result[0]) {
                        // 회원정보 일치
                        console.log("로그인 되었습니다");
                        res.write("0", function() {
                            res.end();
                        });
                    } else {
                        // 회원정보 불일치
                        console.log("회원 정보가 불일치합니다");
                        res.write("-1", function() {
                            res.end();
                        });
                    }
                }
            }
        );
    });
});

app.put("/posture", (req, res) => {
    console.log("PUT");
    var inputData;
    var data = "";
    req.on("data", function(chunk) {
        data += chunk;
    });
    // console.log(data);
    req.on("end", function() {
        inputData = JSON.parse(data);
        var id = inputData['id'];
        //console.log('id : ' + id);
        // console.log(inputData);
        for (var key in inputData) {
            if (!(key == "id")) { // id 정보는 DB에 저장하지 않음
                // console.log("data = " + key);
                // console.log("inputData[data] = " + inputData[key]);

                var postureLR = inputData[key].substring(0, 3);
                var postureFB = inputData[key].substring(3, 6);

                var year = Number(key.substring(0, 4));
                var month = Number(key.substring(4, 6));
                var day = Number(key.substring(6, 8));
                var hour = Number(key.substring(8, 10));
                var min = Number(key.substring(10, 12));

                //console.log("time = " + year + month + day + hour + min);
                //console.log("posture = " + postureLR + " / " + postureFB);

                var valuesInsert = `"${id}", ${year}, ${month}, ${day}, ${hour}, ${min}, ${postureLR}, ${postureFB}`;
                var where = `id = "${id}" and Year = ${year} and Month = ${month} and Day = ${day} and Hour = ${hour} and Min = ${min}`;

                let sql_query = `INSERT INTO Posture(id, Year, Month, Day, Hour, Min, LR, FB) SELECT ${valuesInsert} from DUAL\
                WHERE NOT EXISTS(SELECT * from Posture WHERE ${where});`;
                // 중복이 아닐 때만 삽입
                //console.log(sql_query);
                pool.query(sql_query, function(err, result, fields) {
                    if (err) {
                        throw err;
                    } else {}
                });
            }
        }
    });
    res.end();
});

app.get("/posture", (req, res) => {
    console.log("GET");
    var inputData = req.query;
    // console.log(inputData.year);
    // console.log(inputData.month);
    // console.log(inputData.day);
    // console.log(inputData.hour);
    if (!inputData.month) { // Year
        let sql_query = "select Month, AVG(LR), AVG(FB) from Posture where id = '" + inputData.id + "' and Year = " + Number(inputData.year) + " GROUP BY Month;";
        pool.query(sql_query, function(err, result, fields) {
            if (err) {
                throw err;
            } else {
                // console.log("YEAR" + result);
                res.write(JSON.stringify(result), function() {
                    res.end();
                });
            }
        });
    } else if (!inputData.day) { // Month
        let sql_query = "select Day, AVG(LR), AVG(FB) from Posture where id = '" + inputData.id + "' and Month = " + Number(inputData.month) + " GROUP BY Day;";
        pool.query(sql_query, function(err, result, fields) {
            if (err) {
                throw err;
            } else {
                // console.log("MONTH" + result);
                res.write(JSON.stringify(result), function() {
                    res.end();
                });
            }
        });
    } else if (!inputData.hour) { // Day
        let sql_query = "select Hour, AVG(LR), AVG(FB) from Posture where id = '" + inputData.id + "' and Day = " + Number(inputData.day) + " GROUP BY Hour;";
        pool.query(sql_query, function(err, result, fields) {
            if (err) {
                throw err;
            } else {
                // console.log("DAY" + result);
                res.write(JSON.stringify(result), function() {
                    res.end();
                });
            }
        });
    } else { // Hour
        let sql_query = "select Min, AVG(LR), AVG(FB) from Posture where id = '" + inputData.id + "' and Hour = " + Number(inputData.hour) + " GROUP BY Min;";
        pool.query(sql_query, function(err, result, fields) {
            if (err) {
                throw err;
            } else {
                // console.log("HOUR" + result);
                res.write(JSON.stringify(result), function() {
                    res.end();
                });
            }
        });
    }
});

// 친구 추가
app.post("/friend", (req, res) => {
    var inputData;
    req.on("data", (data) => {
        inputData = JSON.parse(data);
        console.log(inputData);
    });
    req.on("end", () => {
        pool.query("select id from User where id='" + inputData.friend_id + "';", function(err, result, fields) {
            if (err) {
                throw err;
            } else {
                // 회원정보 존재
                if (result[0]) {
                    // console.log(result[0]);

                    // Friend Table에 저장
                    let sql_query = "INSERT INTO `Friend`(`from`, `to`) SELECT '" + inputData.user_id + "', '" + inputData.friend_id + "' FROM DUAL\
                    WHERE NOT EXISTS(SELECT `from`, `to` from `Friend` WHERE `from` = '" + inputData.user_id + "' and `to` = '" + inputData.friend_id + "');";
                    // 중복이 아닐 때만 삽입
                    console.log("SQL : " + sql_query);
                    pool.query(sql_query, function(err, result, fields) {
                        if (err) {
                            throw err;
                        } else {
                            console.log("Friend Table에 항목을 추가하였습니다.");
                        }
                    });
                    // 앱으로 추가된 친구 ID 전달
                    res.write(JSON.stringify(result[0]), function() {
                        res.end();
                    });
                }
                // 회원정보 없음
                else {
                    res.write("-1", function() {
                        res.end();
                    });
                }
            }
        });
    });
});

// 친구 검색
app.delete("/friend", (req, res) => {
    var inputData;
    req.on("data", (data) => {
        inputData = JSON.parse(data);
        //console.log(inputData);
    });
    req.on("end", () => {
        // Friend Table에서 삭제
        //console.log("length " + Object.keys(inputData).length);
        for (var i = 0; i < Object.keys(inputData).length - 1; i++) {
            let sql_query = `DELETE FROM Friend WHERE (\`from\` = '${inputData[0]}' and \`to\` = '${inputData[i+1]}');`;
            pool.query(sql_query, function(err, result, fields) {
                if (err) {
                    throw err;
                } else {
                    console.log(`삭제`);
                }
            });
        }
        res.end();
    });
});

app.post("/get_friend", (req, res) => {
    var inputData;
    req.on("data", (data) => {
        inputData = JSON.parse(data);
        console.log(inputData);
    });
    req.on("end", () => {
        pool.query("select `to` from `Friend` where `from`='" + inputData.user_id + "';", function(err, result, fields) {
            if (err) {
                throw err;
            } else {
                // 앱으로 친구 목록 전달
                console.log(result);
                res.write(JSON.stringify(result), function() {
                    res.end();
                });
            }
        });
    });
});

app.listen(4001, () => {
    console.log("Example app listening on port 4001!");
});