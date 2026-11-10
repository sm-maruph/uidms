const t = value => new Date(value).toISOString();

export const mockRequests = [
  {
    id:'UID-2026-1001', requesterId:'BNGL6191', name:'Md. Rabbi Ali Khan', initials:'MA', action:'New ID creation', system:'WBO', role:'Trade operations user', branch:'Dhanmondi Branch', date:'Nov 10, 09:10 AM', createdAt:t('2026-11-10T09:10:00+06:00'), state:'Pending', step:'Branch manager review', assignedRole:'Branch manager', justification:'I have been assigned trade operations duties and need WBO access to prepare and review daily trade entries.', approvalHistory:[], queryHistory:[], remarks:[],
  },
  {
    id:'UID-2026-1002', requesterId:'BD00438', name:'Sabin Rahman', initials:'SR', action:'Branch transfer', system:'Multiple systems', role:'System role request', branch:'Dhanmondi Branch', date:'Nov 10, 08:20 AM', createdAt:t('2026-11-10T08:20:00+06:00'), state:'Query', step:'Query response · Noor Mohammad Shafi Kamal', assignedRole:null, queryTargetIds:['BD00387'], queryReturnRole:'COO', queryReturnStep:'COO final approval', justification:'Please transfer the listed system access to the Dhanmondi Branch assignment while preserving the employee’s existing approval responsibilities.', transferDetails:{transferRequestType:'Branch transfer',people:[]},
    approvalHistory:[
      {stage:'Branch manager',status:'Approved',by:'Abu Jami',role:'Branch manager',at:t('2026-11-10T08:42:00+06:00'),remark:'Confirmed the employee will report to Dhanmondi Branch from the effective date.'},
      {stage:'IT',status:'Approved',by:'Shah Mohammad Al Noor',role:'IT',at:t('2026-11-10T09:22:00+06:00'),remark:'Access groups checked. Existing access can be moved without a conflict.'},
      {stage:'CITO',status:'Approved',by:'Noor Mohammad Shafi Kamal',role:'CITO',at:t('2026-11-10T10:02:00+06:00'),remark:'Technical review complete; forwarded for final approval.'},
    ],
    queryHistory:[
      {stage:'Branch manager review',by:'Abu Jami',role:'Branch manager',at:t('2026-11-10T08:30:00+06:00'),message:'Please confirm the effective transfer date and whether current branch access should remain active during handover.',targetIds:['BD00438'],targetNames:['Sabin Rahman'],responses:[{employeeId:'BD00438',response:'Effective date is 15 November. Keep current access active through 14 November for handover.',responseBy:'Sabin Rahman',responseAt:t('2026-11-10T08:36:00+06:00')}]},
      {stage:'IT review',by:'Shah Mohammad Al Noor',role:'IT',at:t('2026-11-10T09:02:00+06:00'),message:'Branch manager and HR: please confirm the destination branch and the requested systems for the transferred role.',targetIds:['BNGL0315','BD00438'],targetNames:['Abu Jami','Sabin Rahman'],responses:[{employeeId:'BNGL0315',response:'Dhanmondi Branch is the approved destination. The requested systems match the role.',responseBy:'Abu Jami',responseAt:t('2026-11-10T09:10:00+06:00')},{employeeId:'BD00438',response:'HR confirms the transfer date and destination branch.',responseBy:'Sabin Rahman',responseAt:t('2026-11-10T09:14:00+06:00')}]},
      {stage:'CITO review',by:'Noor Mohammad Shafi Kamal',role:'CITO',at:t('2026-11-10T09:42:00+06:00'),message:'IT: confirm that privileged access is removed from the old branch. Branch manager: provide any exception justification.',targetIds:['BD06619','BNGL0315'],targetNames:['Shah Mohammad Al Noor','Abu Jami'],responses:[{employeeId:'BD06619',response:'Privileged access will be reassigned to the destination branch group; no old-branch admin access remains.',responseBy:'Shah Mohammad Al Noor',responseAt:t('2026-11-10T09:51:00+06:00')},{employeeId:'BNGL0315',response:'No exception is requested. Please proceed with the standard branch access set.',responseBy:'Abu Jami',responseAt:t('2026-11-10T09:55:00+06:00')}]},
      {stage:'COO final approval',by:'Haily Algawatte',role:'COO',at:t('2026-11-10T10:18:00+06:00'),message:'CITO: confirm the old branch access removal and the effective date before final approval.',targetIds:['BD00387'],targetNames:['Noor Mohammad Shafi Kamal'],responses:[]},
    ],
    remarks:[
      {by:'Sabin Rahman',role:'HR',at:t('2026-11-10T08:24:00+06:00'),message:'HR has verified the transfer instruction and employee record.'},
      {by:'Shah Mohammad Al Noor',role:'IT',at:t('2026-11-10T09:24:00+06:00'),message:'The target branch has matching access groups for all listed systems.'},
      {by:'Noor Mohammad Shafi Kamal',role:'CITO',at:t('2026-11-10T10:04:00+06:00'),message:'Approved at technical stage; final approval is pending.'},
    ],
  },
  {
    id:'UID-2026-1003', requesterId:'BNGL6191', name:'Md. Rabbi Ali Khan', initials:'MA', action:'ID reset / unlock', system:'ICBS, WBO', role:'Account unlock', branch:'Dhanmondi Branch', date:'Nov 10, 07:45 AM', createdAt:t('2026-11-10T07:45:00+06:00'), state:'In review', step:'IT review', assignedRole:'IT', justification:'My ICBS and WBO accounts locked after a password reset. I need access restored before the morning transaction window.', resetDetails:{name:'Md. Rabbi Ali Khan',employeeId:'BNGL6191',userId:'BNGL6191',department:'Dhanmondi Branch',systems:['ICBS','WBO']},
    approvalHistory:[{stage:'Branch manager',status:'Approved',by:'Abu Jami',role:'Branch manager',at:t('2026-11-10T08:05:00+06:00'),remark:'Verified the employee and confirmed the access is needed for today’s assigned duties.'}],
    queryHistory:[{stage:'Branch manager review',by:'Abu Jami',role:'Branch manager',at:t('2026-11-10T07:55:00+06:00'),message:'Please confirm the account lock is affecting both systems and provide the required access restoration time.',targetIds:['BNGL6191'],targetNames:['Md. Rabbi Ali Khan'],responses:[{employeeId:'BNGL6191',response:'Both systems are locked. Please restore access before 9:00 AM if possible.',responseBy:'Md. Rabbi Ali Khan',responseAt:t('2026-11-10T08:00:00+06:00')}] }],
    remarks:[{by:'Abu Jami',role:'Branch manager',at:t('2026-11-10T08:06:00+06:00'),message:'Identity verified against the branch employee record.'}],
  },
  {
    id:'UID-2026-1004', requesterId:'BD00438', name:'Sabin Rahman', initials:'SR', action:'ID deactivation', system:'HRIS, Email', role:'Deactivate existing IDs', branch:'Gulshan Branch', date:'Nov 9, 02:15 PM', createdAt:t('2026-11-09T14:15:00+06:00'), state:'Approved', step:'Completed', assignedRole:null, justification:'The employee has left the bank. Deactivate the listed IDs after the final working day and retain the audit record.', deactivationDetails:{name:'Former employee',employeeId:'BD07881',userId:'BD07881',department:'Operations',branch:'Gulshan Branch',systems:['HRIS','Email']},
    approvalHistory:[
      {stage:'Branch manager',status:'Approved',by:'Abu Jami',role:'Branch manager',at:t('2026-11-09T14:42:00+06:00'),remark:'Branch confirmed the employee’s final working day and returned equipment.'},
      {stage:'IT',status:'Approved',by:'Shah Mohammad Al Noor',role:'IT',at:t('2026-11-09T15:18:00+06:00'),remark:'No active service dependencies found. Deactivation can proceed.'},
      {stage:'CITO',status:'Approved',by:'Noor Mohammad Shafi Kamal',role:'CITO',at:t('2026-11-09T15:40:00+06:00'),remark:'Security review complete.'},
      {stage:'COO',status:'Approved',by:'Haily Algawatte',role:'COO',at:t('2026-11-09T16:05:00+06:00'),remark:'Final approval granted. Complete deactivation and retain the audit trail.'},
    ],
    queryHistory:[{stage:'IT review',by:'Shah Mohammad Al Noor',role:'IT',at:t('2026-11-09T15:00:00+06:00'),message:'HR: confirm the final working date and whether the mailbox should be retained for records.',targetIds:['BD00438'],targetNames:['Sabin Rahman'],responses:[{employeeId:'BD00438',response:'Final working date was 9 November. Retain mailbox data under the standard records policy; disable sign-in.',responseBy:'Sabin Rahman',responseAt:t('2026-11-09T15:08:00+06:00')}] }],
    remarks:[{by:'Sabin Rahman',role:'HR',at:t('2026-11-09T14:20:00+06:00'),message:'Exit documentation and employee record have been verified.'},{by:'Haily Algawatte',role:'COO',at:t('2026-11-09T16:06:00+06:00'),message:'Confirm completion in the audit log.'}],
  },
];
