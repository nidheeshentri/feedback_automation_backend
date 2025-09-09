// backend/utils/excel.js
import fs from "fs";
import * as XLSX from "xlsx";

let cachedSummary = [];

// Normalize helper
const norm = (v) => (v ?? "").toString().trim().toLowerCase();

// Read sheet → rows
const readSheet = (filePath) => {
  const wb = XLSX.read(fs.readFileSync(filePath), { type: "buffer" });
  return XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: null });
};

// helper: find column by fuzzy search
const findCol = (row, search) => {
  const key = Object.keys(row).find((k) =>
    k?.toLowerCase().includes(search.toLowerCase())
  );
  return key ? row[key] : "";
};

const ratingValues = {
  "Strongly Agree": 5,
  "Agree": 4,
  "Neutral": 3,
  "Disagree": 2,
  "Strongly Disagree": 1
}

const coordinatorRatingValues = {
  "Excellent": 5,
  "Good": 4,
  "Fair": 3,
  "Poor": 2,
  "Very Poor": 1
}

const getRowData = (course, row, mentorIndex, mentorsRating, currentIndex, cleanEmail, cc) => {
  if (mentorIndex[row["Choose your "+course+" Core Mentor"] || row["Choose your "+course+" Core Mentor "]] != undefined){
    let mentorData = mentorsRating[mentorIndex[row["Choose your "+course+" Core Mentor"] || row["Choose your "+course+" Core Mentor "]]]
    mentorData.avgRating = parseFloat((((mentorData.avgRating * mentorData.feedbackCount) + ratingValues[row["How would you rate your satisfaction with the "+course+" Core Mentor's training?"]])/(mentorData.feedbackCount+1)).toFixed(1))
    mentorData.feedbackCount += 1
    mentorData.feedbacks.push({
      "batch": row["Choose your batch for "+course] || row["Choose your Batch for "+course],
      "rating": row["How would you rate your satisfaction with the "+course+" Core Mentor's training?"],
      "like": row[" Please explain the reasons for your rating\nWhat worked well or didn't work well for you in the "+course+" core training?"],
      "suggestion": row["Any suggestions to improve the training ?"],
      "likedAboutTraining": row["What do you like the most about the training?"],
      "student": row["Email Address"]
    })
  }
  else{
    mentorIndex[row["Choose your "+course+" Core Mentor"] || row["Choose your "+course+" Core Mentor "]] = currentIndex
    currentIndex+=1
    let mentorData = {
      "name": row["Choose your "+course+" Core Mentor"] || row["Choose your "+course+" Core Mentor "],
      "email": cleanEmail[row["Choose your "+course+" Core Mentor"] || row["Choose your "+course+" Core Mentor "]],
      "cc": cc[row["Choose your "+course+" Core Mentor"] || row["Choose your "+course+" Core Mentor "]],
      "course": ""+course+"",
      "avgRating": ratingValues[row["How would you rate your satisfaction with the "+course+" Core Mentor's training?"]],
      "feedbackCount": 1,
      "feedbacks": [
          {
              "batch": row["Choose your batch for "+course] || row["Choose your Batch for "+course],
              "rating": row["How would you rate your satisfaction with the "+course+" Core Mentor's training?"],
              "like": row[" Please explain the reasons for your rating\nWhat worked well or didn't work well for you in the "+course+" core training?"],
              "suggestion": row["Any suggestions to improve the training ?"],
              "likedAboutTraining": row["What do you like the most about the training?"],
              "student": row["Email Address"]
          }
      ]
    }
    mentorsRating.push(mentorData)
  }

  let softSkillMentorName
  if (course !== "AWS"){
    softSkillMentorName = row["Choose your "+course+" Soft Skills Mentor"] || row["Choose your "+course+"  Soft Skills Mentor"]
  }

  if (softSkillMentorName && softSkillMentorName !== "Not Applicable" && softSkillMentorName !== "Not Applicable right now"){
    let currentRating = row["How would you rate your satisfaction with the "+course+" Soft Skill Mentor's training?"] || row["How would you rate your satisfaction with the  "+course+"  Soft Skill Mentor's training?"] || row["How would you rate your satisfaction with the  "+course+" Soft Skill Mentor's training?"]

    if (mentorIndex[softSkillMentorName] != undefined){
      let mentorData = mentorsRating[mentorIndex[softSkillMentorName]]
      mentorData.avgRating = parseFloat((((mentorData.avgRating * mentorData.feedbackCount) + (ratingValues[currentRating]||0))/(mentorData.feedbackCount+1)).toFixed(1))
      mentorData.feedbackCount += 1
      mentorData.feedbacks.push({
        "batch": row["Choose your batch for "+course] || row["Choose your Batch for "+course],
        "rating": currentRating,
        "like": row[" Please explain the reasons for your rating\nWhat worked well or didn't work well for you in the "+course+" softskills training?"],
        "suggestion": row["Any suggestions to improve the training ?"],
        "likedAboutTraining": row["What do you like the most about the training?"],
        "student": row["Email Address"]
      })
    }
    else{
      mentorIndex[softSkillMentorName] = currentIndex
      currentIndex+=1
      let mentorData = {
        "name": softSkillMentorName,
        "email": cleanEmail[softSkillMentorName],
        "cc": cc[softSkillMentorName],
        "course": "Soft Skills",
        "avgRating": ratingValues[currentRating]||0,
        "feedbackCount": 1,
        "feedbacks": [
            {
                "batch": row["Choose your batch for "+course] || row["Choose your Batch for "+course],
                "rating": currentRating,
                "like": row[" Please explain the reasons for your rating\nWhat worked well or didn't work well for you in the "+course+" softskills training?"],
                "suggestion": row["Any suggestions to improve the training ?"],
                "likedAboutTraining": row["What do you like the most about the training?"],
                "student": row["Email Address"]
            }
        ]
      }
      mentorsRating.push(mentorData)
    }
  }

  let coordinatorName = row["Choose your "+course+" Course Coordinator"] || row["Choose your  "+course+" Course Coordinator"]
  if (coordinatorName){
    let currentRating = row["How do you rate the support from the "+course+" course coordinator ?"] || row["How do you rate the support from the "+course+" Course Coordinator ?"] || row["How do you rate the support from the  "+course+" course coordinator ?"]
    if (mentorIndex[coordinatorName] != undefined){
      let mentorData = mentorsRating[mentorIndex[coordinatorName]]
      mentorData.avgRating = parseFloat((((mentorData.avgRating * mentorData.feedbackCount) + (coordinatorRatingValues[currentRating] || 0))/(mentorData.feedbackCount+1)).toFixed(1))
      mentorData.feedbackCount += 1
      mentorData.feedbacks.push({
        "batch": row["Choose your batch for "+course] || row["Choose your Batch for "+course],
        "rating": currentRating,
        "like": row[" Please explain the reasons for your rating\nWhat worked well or didn't work well for you in the "+course+" Coordinators support?"] || row["   Please explain the reasons for your rating\nWhat worked well or didn't work well for you in the "+course+" Coordinators support?"],
        "suggestion": row["Any suggestions to improve the training ?"],
        "likedAboutTraining": row["What do you like the most about the training?"],
        "student": row["Email Address"]
      })
    }
    else{
      mentorIndex[coordinatorName] = currentIndex
      currentIndex+=1
      let mentorData = {
        "name": coordinatorName,
        "email": cleanEmail[coordinatorName],
        "cc": cc[coordinatorName],
        "course": "Coordinator",
        "avgRating": coordinatorRatingValues[currentRating] || 0,
        "feedbackCount": 1,
        "feedbacks": [
            {
                "batch": row["Choose your batch for "+course] || row["Choose your Batch for "+course],
                "rating": currentRating,
                "like": row[" Please explain the reasons for your rating\nWhat worked well or didn't work well for you in the "+course+" Coordinators support?"] || row["   Please explain the reasons for your rating\nWhat worked well or didn't work well for you in the "+course+" Coordinators support?"],
                "suggestion": row["Any suggestions to improve the training ?"],
                "likedAboutTraining": row["What do you like the most about the training?"],
                "student": row["Email Address"]
            }
        ]
      }
      mentorsRating.push(mentorData)
    }
  }
  return {mentorIndex, mentorsRating, currentIndex}
}

const dateStringToExcelSerial = (dateString) => {
  const jsDate = new Date(dateString);
  const excelEpoch = new Date(1900, 0, 1);
  const msPerDay = 24 * 60 * 60 * 1000;
  
  const diffTime = jsDate.getTime() - excelEpoch.getTime();
  const diffDays = Math.ceil(diffTime / msPerDay);
  
  return diffDays + 2;
};

export const processExcelFiles = (feedbackPath, mentorPath) => {
  const fbRows = readSheet(feedbackPath);
  const mentorRows = readSheet(mentorPath);
  const cleanEmail = {}
  const cc = {}
  for (let mail of mentorRows){
    cleanEmail[mail[" Mentor"]] = mail.Email
    cc[mail[" Mentor"]] = mail.cc
  }
  // console.log(cleanEmail)

  let currentIndex = 0
  let mentorsRating = []
  let mentorIndex = {}
  for (let row of fbRows){
    if (dateStringToExcelSerial("8/25/2025")>row.Timestamp){
      continue
    }
    let returnData
    if (row["Choose your FSD Core Mentor"]){
      returnData = getRowData("FSD", row, mentorIndex, mentorsRating, currentIndex, cleanEmail, cc)
    }
    else if (row["Choose your DSML Core Mentor"]){
      returnData = getRowData("DSML", row, mentorIndex, mentorsRating, currentIndex, cleanEmail, cc)
    }
    else if (row["Choose your Python Core Mentor"]){
      returnData = getRowData("Python", row, mentorIndex, mentorsRating, currentIndex, cleanEmail, cc)
    }else if (row["Choose your SWT Core Mentor"]){
      returnData = getRowData("SWT", row, mentorIndex, mentorsRating, currentIndex, cleanEmail, cc)
    }else if (row["Choose your AWS Core Mentor"]){
      returnData = getRowData("AWS", row, mentorIndex, mentorsRating, currentIndex, cleanEmail, cc)
    }else if (row["Choose your DA Core Mentor "]){
      returnData = getRowData("DA", row, mentorIndex, mentorsRating, currentIndex, cleanEmail, cc)
    }else if (row["Choose your DS Core Mentor"]){
      returnData = getRowData("DS", row, mentorIndex, mentorsRating, currentIndex, cleanEmail, cc)
    }else if (row["Choose your UI/UX Core Mentor"]){
      returnData = getRowData("UI/UX", row, mentorIndex, mentorsRating, currentIndex, cleanEmail, cc)
    }else if (row["Choose your FL Core Mentor"]){
      returnData = getRowData("FL", row, mentorIndex, mentorsRating, currentIndex, cleanEmail, cc)
    }
    if (returnData){
      mentorIndex = returnData.mentorIndex
      mentorsRating = returnData.mentorsRating
      currentIndex = returnData.currentIndex
    }
  }
  // console.log("===========================================================")
  // console.log(courseDataLength)
  // console.log("===========================================================")

  // Mentor info map (flexible headers)
  const mentorInfo = new Map();
  mentorRows.forEach((m) => {
    const mentorName = findCol(m, "mentor");
    const email = findCol(m, "email");
    const course = findCol(m, "course");

    if (!mentorName) return;

    mentorInfo.set(norm(mentorName), {
      email: email || "N/A",
      course: course || "N/A",
    });
  });

  const byMentor = new Map();

  for (const row of fbRows) {
    const student = findCol(row, "email address") || "N/A";
    const course = findCol(row, "course") || "N/A";
    const batch = findCol(row, "batch") || "-";

    // Extract mentors
    const core = findCol(row, "core mentor");
    const soft = findCol(row, "soft skills mentor");
    const coord = findCol(row, "coordinator");

    // Ratings
    const rCore = Number(findCol(row, "rating (core") || 0);
    const rSoft = Number(findCol(row, "rating (soft") || 0);
    const rCC = Number(findCol(row, "rating (cc") || 0);

    // Comments
    const commentCore = findCol(row, "core training") || "";
    const commentSoft = findCol(row, "softskills training") || "";
    const commentCC = findCol(row, "coordinator") || "";

    // Suggestions (if exists)
    const suggestion =
      findCol(row, "suggestion") || findCol(row, "improve") || "";

    const addFeedback = (mentorName, rating, comment) => {
      if (!mentorName) return;
      const key = norm(mentorName);
      const info = mentorInfo.get(key) || { email: "N/A", course };

      if (!byMentor.has(key)) {
        byMentor.set(key, {
          name: mentorName,
          email: info.email,
          course: info.course,
          sum: 0,
          count: 0,
          feedbacks: [],
        });
      }
      const m = byMentor.get(key);
      if (rating) {
        m.sum += rating;
        m.count += 1;
      }
      m.feedbacks.push({
        batch,
        rating,
        like: comment, // ✅ fixed: matches mail template
        suggestion,
        student,
      });
    };

    addFeedback(core, rCore, commentCore);
    addFeedback(soft, rSoft, commentSoft);
    addFeedback(coord, rCC, commentCC);
  }

  // Final summary
  const summary = Array.from(byMentor.values()).map((m) => ({
    name: m.name,
    email: m.email,
    course: m.course,
    avgRating: m.count ? (m.sum / m.count).toFixed(2) : "0.00",
    feedbackCount: m.count,
    feedbacks: m.feedbacks,
  }));

  cachedSummary = summary;
  return mentorsRating;
};

export const getSummary = () => cachedSummary;
