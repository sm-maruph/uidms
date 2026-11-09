export const requestRoles = {
  ICBS:['Inquiry','Entry','Supervisor','Assistant Manager','Manager'],
  'RVI Web Portal Access':[],
  Query:['Inquiry','Entry','Supervisor','Assistant Manager','Manager'],
  ITMBD:['Inquiry','Entry','Supervisor','Assistant Manager','Manager'],
  T4S:['Teller','Supervisor','Executive Officer','Manager'],
  'Cheque Clearing':['Maker','Checker','Admin'],
  BEFTN:['Maker','Checker','Admin'],
  HRIS:['Inquiry','Entry','Supervisor','Assistant Manager','Manager'],
  LOS:['Corporate Banking — Relationship Officer (RO)','Corporate Banking — Relationship Manager (RM)','Corporate Banking — Head of Unit (HO)','Credit Admin — Credit Officer','Credit Admin — Manager (Manager-CAD)','Credit Admin — HO-CAD','Islamic Banking — Assistant Manager Islamic Banking','Islamic Banking — Manager Islamic Banking','Card Center — Officer','Card Center — Manager','Customer Service — Officer','Customer Service — Assistant Manager','Customer Service — Manager'],
  WBO:[],
  Eximbills:['Operator','Checker','Authorizer'],
  SWIFT_Jump:['Operator','Checker'],
  'SWIFT ID':['Operator','Checker'],
  'SWIFT Demerged ID (ex-BNGLXXXXX / BD0XXXXXX)':['Operator','Checker'],
  CITRIX_R:[],
  'ITMBD Test':['Inquiry','Entry','Supervisor','Assistant Manager','Manager'],
  'ICBS Test':['Inquiry','Entry','Supervisor','Assistant Manager','Manager'],
  'AD ID':[], 'AMLOCK ID':[], 'Internet Access':[], 'E-Journal':[], 'FX Portal':[], Quantum:[],
  'NID Verification':[], E2gen:[], MCAS:[], 'Jira ID':[], 'Wi-Fi Access':[], 'External Device Access':[], IDrive:[], 'N Drive':[], Email:[],
};

export const requestSystems = Object.keys(requestRoles);
export const otherAccessSystems = ['AD ID','AMLOCK ID','Internet Access','E-Journal','FX Portal','Quantum','NID Verification','E2gen','MCAS','Jira ID'];
export const formResetSystems = ['ICBS','RVI Web Portal Access','Query','ITMBD','T4S','Cheque Clearing','BEFTN','HRIS','LOS','WBO','Eximbills','SWIFT_Jump','SWIFT ID','SWIFT Demerged ID (ex-BNGLXXXXX / BD0XXXXXX)','CITRIX_R',...otherAccessSystems,'ITMBD Test','ICBS Test'];
