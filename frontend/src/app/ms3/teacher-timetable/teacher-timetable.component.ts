import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { TimetableService } from '../services/timetable.service';
import { AbsenceService } from '../services/absence.service';
import { NgForm, NgModel } from '@angular/forms';
import { Absence } from '../models/absence.model';
import { ISession } from '../models/session.model';
import { MsService } from '../services/ms.service';
import { S2Service } from 'src/app/ms1/services/s2.service';

@Component({
  selector: 'app-teacher-timetable',
  templateUrl: './teacher-timetable.component.html',
  styleUrls: ['./teacher-timetable.component.css']
})
export class TeacherTimetableComponent {
  minDate!:string;
  maxDate!:string;
  daysOfWeek: String[] = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  data: any[] = [];
  times: any[] = [];
  days: number[] = [];
  day!:number;
  session_id!:string;
  AbsencesBySession:ISession[] = []
  id:number;
  students:any = []
  studentsf:any = []
  

  @ViewChild('absenceForm') absenceForm!: NgForm;
  @ViewChild('date') date!: NgModel;
  showModal: boolean = false;


  constructor(private timetableService:TimetableService, 
    private absenceService:AbsenceService,
    private ms:MsService, 
    private changeDetection: ChangeDetectorRef,
    private auth:S2Service){
      this.id = Number.parseInt(this.auth.getUserId());
      ms.getAcademicYears().subscribe((res:any)=>{
        let dates = ms.getLastAcademicYear(res);
        this.minDate = dates.min;
        this.maxDate = dates.max;
      })
    }
  ngOnInit() {
    this.get(this.id);
  }
  get(id: number) {
    this.data = [];
    this.times = [];
    this.days = [];
    this.timetableService.getTimetableByTeacher(id).subscribe((data: any) => {
      let All = this.timetableService.getDataForTable(data);
      this.data = All.sessions;
      this.days = All.days;
      this.times = All.times;
    })
  }
  Add(){
    this.absenceService.addAbsences(this.getFormData()).subscribe((res:any)=>{
      this.hide()
    })
  }
  show(session_id:string, group_id:string, day:number) {
    this.session_id = session_id
    this.showModal = true
    this.day = day
    this.ms.getStudentsByGroupe(group_id).subscribe((res)=>{
      this.students = res;
    })
  }
  hide() {
    this.showModal = false
    this.session_id = "";
    this.absenceForm.reset()
    this.students = []
    this.studentsf = []
  }
  selectDate(){
    let date = new Date(this.absenceForm.controls['date'].value);
    if(date.getDay()== this.day){
      this.absenceService.getAbsencesBySessionAndDate(this.session_id,this.absenceForm.controls['date'].value).subscribe((res:any)=>{
        this.AbsencesBySession = res;
        let newList = [];
        for(let student of this.students)
          if(!this.isAbsent(student.id))
            newList.push(student);
        this.studentsf = newList;
        this.changeDetection.detectChanges()
      });
    }else{
      this.absenceForm.reset()
    }
  }
  getFormData():Absence[]{
    let absences:Absence[] = [];
    for(let i in this.absenceForm.controls['students_id'].value){
      let absence = new Absence();
      absence.session_id = this.session_id
      absence.student_id = this.absenceForm.controls['students_id'].value[i]
      let s = this.students.find((item:any)=>{return item.id == absence.student_id});
      absence.student_full_name = s.prenom+' '+s.nom;
      absence.date = this.absenceForm.controls['date'].value
      absence.status = 0
      absences.push(absence)
    }
    return absences;
  }
  isAbsent(id:string){
    return this.AbsencesBySession.filter((item:any)=>{return item.student_id==id}).length > 0
  }
}
