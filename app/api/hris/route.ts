import {env} from "cloudflare:workers";
type Body={action?:string;[key:string]:unknown};
const db=()=>{if(!env.DB)throw Error("Database unavailable");return env.DB};
const s=(v:unknown,n=150)=>typeof v==="string"?v.trim().slice(0,n):"";
const positive=(v:unknown)=>typeof v==="number"&&Number.isInteger(v)&&v>0&&v<=10000000000;
const nonnegative=(v:unknown)=>typeof v==="number"&&Number.isInteger(v)&&v>=0&&v<=10000000000;
const validDate=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
const bad=(error:string,status=400)=>Response.json({error},{status});
const failure=(e:unknown)=>{console.error("HRIS operation failed",e);return bad("The operation could not be completed. Please retry.",500)};
const stamp=()=>new Date().toISOString();
export async function GET(){
 try{const d=db();const [departments,positions,employees,attendance,leaves,runs,items]=await d.batch([
  d.prepare("SELECT * FROM departments ORDER BY name"),
  d.prepare("SELECT p.*,d.name AS department_name FROM positions p JOIN departments d ON d.id=p.department_id ORDER BY p.title"),
  d.prepare("SELECT e.*,d.name AS department_name,p.title AS position_title FROM employees e JOIN departments d ON d.id=e.department_id JOIN positions p ON p.id=e.position_id ORDER BY e.id DESC"),
  d.prepare("SELECT a.*,e.first_name||' '||e.last_name AS employee_name FROM attendance a JOIN employees e ON e.id=a.employee_id ORDER BY a.work_date DESC,a.id DESC LIMIT 500"),
  d.prepare("SELECT l.*,e.first_name||' '||e.last_name AS employee_name,d.name AS department_name FROM leave_requests l JOIN employees e ON e.id=l.employee_id JOIN departments d ON d.id=e.department_id ORDER BY l.created_at DESC LIMIT 500"),
  d.prepare("SELECT * FROM payroll_runs ORDER BY period DESC LIMIT 60"),
  d.prepare("SELECT i.*,e.first_name||' '||e.last_name AS employee_name FROM payroll_items i JOIN employees e ON e.id=i.employee_id ORDER BY i.id DESC LIMIT 1000")
 ]);return Response.json({departments:departments.results,positions:positions.results,employees:employees.results,attendance:attendance.results,leaves:leaves.results,runs:runs.results,items:items.results})}catch(e){return failure(e)}
}
export async function POST(request:Request){
 let b:Body;try{b=await request.json() as Body}catch{return bad("Invalid request.")}
 try{const d=db(),now=stamp();
  if(b.action==="seed"){
   const count=await d.prepare("SELECT COUNT(*) AS count FROM departments").first<{count:number}>();
   if((count?.count??0)>0)return bad("The workspace already has departments.",409);
   const departments=[["Engineering","Sofia Reyes","Makati"],["People & Culture","Angela Cruz","Makati"],["Sales","Marco Santos","Taguig"],["Finance","Daniel Lim","Makati"],["Operations","Patricia Yu","Pasig"]];
   const positions=[["Senior Software Engineer",1,"L5",11000000],["HR Specialist",2,"L3",5600000],["Account Executive",3,"L3",6500000],["Finance Analyst",4,"L4",7500000],["Operations Coordinator",5,"L2",4800000],["Product Designer",1,"L4",8700000]];
   const employees=[
    ["EMP-001","Sofia","Reyes","sofia@peopleflow.example",1,1,"2023-02-15","Active","Regular",11000000],
    ["EMP-002","Angela","Cruz","angela@peopleflow.example",2,2,"2023-05-08","Active","Regular",5600000],
    ["EMP-003","Marco","Santos","marco@peopleflow.example",3,3,"2024-01-17","Active","Regular",6500000],
    ["EMP-004","Daniel","Lim","daniel@peopleflow.example",4,4,"2022-09-12","Active","Regular",7500000],
    ["EMP-005","Patricia","Yu","patricia@peopleflow.example",5,5,"2024-03-04","Active","Regular",4800000],
    ["EMP-006","Isabella","Garcia","isabella@peopleflow.example",1,6,"2024-06-10","Active","Regular",8700000],
    ["EMP-007","Nathan","Dela Cruz","nathan@peopleflow.example",3,3,"2025-01-20","On leave","Regular",6500000]
   ];
   const today=new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Manila"});
   await d.batch([
    ...departments.map(x=>d.prepare("INSERT INTO departments(name,lead,location) VALUES(?,?,?)").bind(...x)),
    ...positions.map(x=>d.prepare("INSERT INTO positions(title,department_id,grade,base_salary_cents) VALUES(?,?,?,?)").bind(...x)),
    ...employees.map(x=>d.prepare("INSERT INTO employees(employee_no,first_name,last_name,email,department_id,position_id,start_date,status,employment_type,monthly_salary_cents) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(...x)),
    ...[1,2,3,4,5].map(id=>d.prepare("INSERT INTO attendance(employee_id,work_date,clock_in,status) VALUES(?,?,?,?)").bind(id,today,now,"Present")),
    d.prepare("INSERT INTO leave_requests(employee_id,type,start_date,end_date,days,reason,status,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(7,"Vacation",today,today,1,"Personal time","Approved",now),
    d.prepare("INSERT INTO leave_requests(employee_id,type,start_date,end_date,days,reason,status,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(6,"Sick",today,today,1,"Medical appointment","Pending",now)
   ]);
   return Response.json({message:"Sample workspace loaded."});
  }
  if(b.action==="department"){
   const name=s(b.name),lead=s(b.lead),location=s(b.location);
   if(!name)return bad("Department name is required.");
   const exists=await d.prepare("SELECT id FROM departments WHERE name=?").bind(name).first();if(exists)return bad("A department with that name already exists.",409);
   await d.prepare("INSERT INTO departments(name,lead,location) VALUES(?,?,?)").bind(name,lead,location).run();
   return Response.json({message:"Department added."},{status:201});
  }
  if(b.action==="position"){
   const title=s(b.title),departmentId=b.departmentId,grade=s(b.grade),base=b.baseSalaryCents;
   if(!title||!positive(departmentId)||!nonnegative(base))return bad("Enter a position, department and valid monthly salary.");
   const exists=await d.prepare("SELECT id FROM departments WHERE id=?").bind(departmentId).first();if(!exists)return bad("Department not found.");
   await d.prepare("INSERT INTO positions(title,department_id,grade,base_salary_cents) VALUES(?,?,?,?)").bind(title,departmentId,grade,base).run();
   return Response.json({message:"Position added."},{status:201});
  }
  if(b.action==="employee"||b.action==="updateEmployee"){
   const employeeNo=s(b.employeeNo,40),firstName=s(b.firstName),lastName=s(b.lastName),email=s(b.email),departmentId=b.departmentId,positionId=b.positionId,startDate=s(b.startDate),status=s(b.status),employmentType=s(b.employmentType),salary=b.monthlySalaryCents;
   if(!employeeNo||!firstName||!lastName||!email.includes("@")||!positive(departmentId)||!positive(positionId)||!validDate(startDate)||!nonnegative(salary)||!["Active","On leave","Inactive"].includes(status)||!["Regular","Probationary","Contractual","Part-time"].includes(employmentType))return bad("Complete the employee fields with valid values.");
   const pos=await d.prepare("SELECT id FROM positions WHERE id=? AND department_id=?").bind(positionId,departmentId).first();if(!pos)return bad("Position must belong to the selected department.");
   if(b.action==="employee"){
    const exists=await d.prepare("SELECT id FROM employees WHERE employee_no=?").bind(employeeNo).first();if(exists)return bad("Employee number already exists.",409);
    await d.prepare("INSERT INTO employees(employee_no,first_name,last_name,email,department_id,position_id,start_date,status,employment_type,monthly_salary_cents) VALUES(?,?,?,?,?,?,?,?,?,?)").bind(employeeNo,firstName,lastName,email,departmentId,positionId,startDate,status,employmentType,salary).run();
    return Response.json({message:"Employee added."},{status:201});
   }
   if(!positive(b.id))return bad("Employee not found.");
   const result=await d.prepare("UPDATE employees SET employee_no=?,first_name=?,last_name=?,email=?,department_id=?,position_id=?,start_date=?,status=?,employment_type=?,monthly_salary_cents=? WHERE id=?").bind(employeeNo,firstName,lastName,email,departmentId,positionId,startDate,status,employmentType,salary,b.id).run();
   if(!result.meta.changes)return bad("Employee not found.",404);
   return Response.json({message:"Employee profile updated."});
  }
  if(b.action==="clock"){
   const id=b.employeeId,workDate=s(b.workDate),event=s(b.event);
   if(!positive(id)||!validDate(workDate)||!["in","out"].includes(event))return bad("Choose an employee, date and clock action.");
   if(workDate!==new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Manila"}))return bad("Clock events can only be recorded for today.");
   const employee=await d.prepare("SELECT id,status FROM employees WHERE id=?").bind(id).first<{id:number;status:string}>();
   if(!employee||employee.status!=="Active")return bad("Choose an active employee.");
   const row=await d.prepare("SELECT id,clock_in,clock_out FROM attendance WHERE employee_id=? AND work_date=?").bind(id,workDate).first<{id:number;clock_in:string|null;clock_out:string|null}>();
   if(event==="in"){if(row)return bad("This employee already has attendance for that date.",409);await d.prepare("INSERT INTO attendance(employee_id,work_date,clock_in,status) VALUES(?,?,?,?)").bind(id,workDate,now,"Present").run();return Response.json({message:"Clock-in recorded."})}
   if(!row||!row.clock_in||row.clock_out)return bad("A clock-in without a clock-out is required.",409);
   await d.prepare("UPDATE attendance SET clock_out=? WHERE id=? AND clock_out IS NULL").bind(now,row.id).run();
   return Response.json({message:"Clock-out recorded."});
  }
  if(b.action==="leave"){
   const employeeId=b.employeeId,type=s(b.type),startDate=s(b.startDate),endDate=s(b.endDate),reason=s(b.reason,300);
   if(!positive(employeeId)||!["Vacation","Sick","Emergency","Unpaid"].includes(type)||!validDate(startDate)||!validDate(endDate)||endDate<startDate)return bad("Enter valid leave dates and type.");
   const emp=await d.prepare("SELECT id FROM employees WHERE id=?").bind(employeeId).first();if(!emp)return bad("Employee not found.");
   const days=Math.round((Date.parse(endDate)-Date.parse(startDate))/86400000)+1;if(days>60)return bad("A request can cover at most 60 calendar days.");
   await d.prepare("INSERT INTO leave_requests(employee_id,type,start_date,end_date,days,reason,status,created_at) VALUES(?,?,?,?,?,?,?,?)").bind(employeeId,type,startDate,endDate,days,reason,"Pending",now).run();
   return Response.json({message:"Leave request submitted."},{status:201});
  }
  if(b.action==="leaveDecision"){
   if(!positive(b.id)||!["Approved","Rejected"].includes(s(b.decision)))return bad("Invalid leave decision.");
   const result=await d.prepare("UPDATE leave_requests SET status=? WHERE id=? AND status='Pending'").bind(s(b.decision),b.id).run();
   if(!result.meta.changes)return bad("Only pending requests can be reviewed.",409);
   return Response.json({message:"Leave request "+s(b.decision).toLowerCase()+"."});
  }
  if(b.action==="payroll"){
   const period=s(b.period,7);if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(period))return bad("Choose a valid payroll month.");
   const exists=await d.prepare("SELECT id FROM payroll_runs WHERE period=?").bind(period).first();if(exists)return bad("A payroll run already exists for that month.",409);
   const employees=await d.prepare("SELECT id,monthly_salary_cents FROM employees WHERE status='Active' ORDER BY id").all<{id:number;monthly_salary_cents:number}>();
   if(!employees.results.length)return bad("Add at least one active employee first.");
   const runId=crypto.randomUUID(),total=employees.results.reduce((n,e)=>n+e.monthly_salary_cents,0);
   await d.batch([
    d.prepare("INSERT INTO payroll_runs(id,period,status,created_at,total_cents) VALUES(?,?,?,?,?)").bind(runId,period,"Draft",now,total),
    ...employees.results.map(e=>d.prepare("INSERT INTO payroll_items(run_id,employee_id,basic_cents,allowance_cents,deduction_cents,net_cents) VALUES(?,?,?,?,?,?)").bind(runId,e.id,e.monthly_salary_cents,0,0,e.monthly_salary_cents))
   ]);
   return Response.json({message:"Draft payroll generated."},{status:201});
  }
  if(b.action==="finalizePayroll"){
   const id=s(b.id,80);if(!id)return bad("Choose a payroll run.");
   const result=await d.prepare("UPDATE payroll_runs SET status='Finalized',finalized_at=? WHERE id=? AND status='Draft'").bind(now,id).run();
   if(!result.meta.changes)return bad("Only draft payroll runs can be finalized.",409);
   return Response.json({message:"Payroll run finalized."});
  }
  return bad("Unknown action.");
 }catch(e){return failure(e)}
}
