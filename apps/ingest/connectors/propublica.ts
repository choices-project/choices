export async function getRecentVotesForMember(_memberId: string) {
  // STUB 3 recent votes
  return [
    { roll: "H123", date: "2024-12-01", title: "Appropriations Act", position: "Yea", result: "Passed" },
    { roll: "H127", date: "2024-12-05", title: "Defense Authorization", position: "Nay", result: "Passed" },
    { roll: "H132", date: "2024-12-12", title: "Healthcare Transparency", position: "Yea", result: "Failed" }
  ];
}
