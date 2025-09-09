function badge(color, text) {
  return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:6px;font-weight:600">${text}</span>`;
}

function ratingTag(r) {
  if (r == null) return badge('#777', 'No Rating');
  if (r >= 4.5) return badge('#16a34a', `${r} | Outstanding`);
  if (r >= 4.0) return badge('#22c55e', `${r} | Excellent`);
  if (r >= 3.5) return badge('#eab308', `${r} | Good`);
  return badge('#ef4444', `${r} | Needs Work`);
}

export function buildEmailHTML({
  name,
  email,
  course,
  feedbackCount,
  avgRating,
  feedbacks,
  monthLabel
}) {
  const safe = (v) => (v ?? '').toString().replace(/</g, '&lt;');

  // Header
  const header = `
    <p>Hi ${safe(name)},</p>
    <p>Please find below the summary of the feedback analysis for the month of <b>${safe(monthLabel)}</b>.</p>
    <p>
      Your Feedback Count: <b>${feedbackCount.toString().padStart(2, '0')}</b><br/>
      Your Feedback Rating: ${ratingTag(Number(avgRating))}
    </p>
  `;

  // Table rows (directly from excel.js feedbacks)
  const rowsHtml = feedbacks.map(f => `
    <tr>
      <td style="border:1px solid #ddd;padding:6px">${safe(f.student)}</td>
      <td style="border:1px solid #ddd;padding:6px">${safe(f.rating)}</td>
      <td style="border:1px solid #ddd;padding:6px">${safe(f.comment)}</td>
    </tr>
  `).join('');

  // Table wrapper
  const table = `
    <table style="border-collapse:collapse;width:100%;margin:12px 0">
      <thead>
        <tr style="background:#dbeafe">
          <th style="border:1px solid #ddd;padding:6px">Student</th>
          <th style="border:1px solid #ddd;padding:6px">Rating</th>
          <th style="border:1px solid #ddd;padding:6px">Comment</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  `;

  // Footer
  const footer = `
    <p style="font-style:italic">
      Do work on the improvement areas, and aim to maintain or improve your rating in the coming months.
    </p>
    <p><i>Green: Excellent Job! &nbsp;&nbsp; Red: Immediate Attention. Critical.</i></p>
    <p>—<br/>Team Feedback Automation System</p>
  `;

  // Final HTML
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#333;">
      <h2 style="color:#1d4ed8;">Feedback Summary - ${safe(course)}</h2>
      ${header}
      ${table}
      ${footer}
    </div>
  `;
}
