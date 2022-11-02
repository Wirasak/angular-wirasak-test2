import { Component, ViewEncapsulation, Inject, ViewChild } from '@angular/core';
import { hospitalData, waitingList, scheduleConstraintWSOData } from './data';

import {
  extend,
  closest,
  remove,
  addClass,
  isNullOrUndefined,
} from '@syncfusion/ej2-base';
import {
  EventSettingsModel,
  View,
  GroupModel,
  TimelineViewsService,
  TimelineMonthService,
  ResizeService,
  WorkHoursModel,
  DragAndDropService,
  ResourceDetails,
  ScheduleComponent,
  ActionEventArgs,
  CellClickEventArgs,
} from '@syncfusion/ej2-angular-schedule';
import { DragAndDropEventArgs } from '@syncfusion/ej2-navigations';
import { TreeViewComponent } from '@syncfusion/ej2-angular-navigations';
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.css'],
  encapsulation: ViewEncapsulation.None,
  providers: [
    TimelineViewsService,
    TimelineMonthService,
    ResizeService,
    DragAndDropService,
  ],
})
export class AppComponent {
  @ViewChild('scheduleObj') public scheduleObj: ScheduleComponent;
  @ViewChild('treeObj') public treeObj: TreeViewComponent;

  public isTreeItemDropped = false;
  public draggedItemId = '';

  public data: Record<string, any>[] = extend(
    [],
    scheduleConstraintWSOData,
    null,
    true
  ) as Record<string, any>[];
  public selectedDate: Date = new Date(2021, 7, 2);
  public monthInterval: number = 60;
  public workHours: WorkHoursModel = { start: '08:00', end: '18:00' };

  public consultantDataSource: Record<string, any>[] = [
    {
      Text: 'Chao Phraya (J)',
      Id: 1,
      GroupId: 1,
      Color: '#bbdc00',
      Designation: '',
    },
    {
      Text: 'Krathong (J)',
      Id: 2,
      GroupId: 2,
      Color: '#9e5fff',
      Designation: '',
    },
    {
      Text: 'T-18 (T)',
      Id: 3,
      GroupId: 3,
      Color: '#bbdc00',
      Designation: '',
    },
  ];

  public group: GroupModel = {
    enableCompactView: false,
    resources: ['Consultants'],
  };

  public allowMultiple = false;
  public eventSettings: EventSettingsModel = {
    dataSource: this.data,
    fields: {
      subject: { title: 'Project Name', name: 'Name' },
      startTime: { title: 'Project Start Date', name: 'StartTime' },
      endTime: { title: 'Drilling End Date', name: 'EndTime' },
      description: { title: 'Description', name: 'Description' },
    },
  };

  public field: Record<string, any> = {
    dataSource: waitingList,
    id: 'Id',
    text: 'Name',
  };
  public allowDragAndDrop = true;

  constructor() {}

  public getConsultantName(value: ResourceDetails): string {
    return (value as ResourceDetails).resourceData[
      (value as ResourceDetails).resource.textField
    ] as string;
  }

  public getConsultantStatus(value: ResourceDetails): boolean {
    const resourceName: string = this.getConsultantName(value);
    return !(resourceName === 'GENERAL' || resourceName === 'DENTAL');
  }

  public getConsultantDesignation(value: ResourceDetails): string {
    const resourceName: string = this.getConsultantName(value);
    if (resourceName === 'GENERAL' || resourceName === 'DENTAL') {
      return '';
    } else {
      return (value as ResourceDetails).resourceData.Designation as string;
    }
  }

  public getConsultantImageName(value: ResourceDetails): string {
    return this.getConsultantName(value).toLowerCase();
  }

  public onItemDragStop(event: any): void {
    let overlapEvent = this.scheduleObj.eventBase
      .filterEvents(event.data.StartTime, event.data.EndTime)
      .filter(
        (x) =>
          x.ConsultantID == event.data.ConsultantID && x.Id != event.data.Id
      )[0]; //to find the overlapped events on dropping the event.
    let eventsToBeReschedule = this.scheduleObj
      .getEvents(event.data.StartTime)
      .filter((x) => x.ConsultantID == event.data.ConsultantID); // get the events to be reschedule due to overlap
    let overlapEventIndex = eventsToBeReschedule.findIndex(
      (x) => x.Id == overlapEvent.Id
    );
    if (overlapEventIndex != -1) {
      eventsToBeReschedule.splice(overlapEventIndex, 1);
    }
    let dropEventIndex = eventsToBeReschedule.findIndex(
      (x) => x.Id == event.data.Id
    );
    if (dropEventIndex != -1) {
      eventsToBeReschedule.splice(dropEventIndex, 1);
    }
    let startTime = event.data.EndTime;
    if (!isNullOrUndefined(overlapEvent)) {
      startTime = overlapEvent.EndTime;
      let timeDiff = event.data.EndTime - event.data.StartTime;
      event.data.StartTime = new Date(startTime.getTime() + 86400000);
      event.data.EndTime = new Date(event.data.StartTime.getTime() + timeDiff);
      this.scheduleObj.saveEvent(overlapEvent, 'Save');
      startTime = event.data.EndTime;

      for (let i = 0; i < eventsToBeReschedule.length; i++) {
        let timeDiff =
          eventsToBeReschedule[i].EndTime - eventsToBeReschedule[i].StartTime;
        eventsToBeReschedule[i].StartTime = new Date(
          startTime.getTime() + 86400000
        );
        eventsToBeReschedule[i].EndTime = new Date(
          eventsToBeReschedule[i].StartTime.getTime() + timeDiff
        );
        startTime = eventsToBeReschedule[i].EndTime;
      }
      this.scheduleObj.saveEvent(eventsToBeReschedule, 'Save');
    }
  }
  public onItemDrag(event: any): void {
    if (this.scheduleObj.isAdaptive) {
      const classElement: HTMLElement =
        this.scheduleObj.element.querySelector('.e-device-hover');
      if (classElement) {
        classElement.classList.remove('e-device-hover');
      }
      if (event.event.target.classList.contains('e-work-cells')) {
        addClass([event.event.target], 'e-device-hover');
      }
    }
    if (document.body.style.cursor === 'not-allowed') {
      document.body.style.cursor = '';
    }
    if (event.name === 'nodeDragging') {
      const dragElementIcon: NodeListOf<HTMLElement> =
        document.querySelectorAll(
          '.e-drag-item.treeview-external-drag .e-icon-expandable'
        );
      for (const icon of [].slice.call(dragElementIcon)) {
        icon.style.display = 'none';
      }
    }
  }

  public onActionBegin(event: ActionEventArgs): void {
    if (event.requestType === 'eventCreate' && this.isTreeItemDropped) {
      const treeViewData: Record<string, any>[] = this.treeObj.fields
        .dataSource as Record<string, any>[];
      const filteredPeople: Record<string, any>[] = treeViewData.filter(
        (item: any) => item.Id !== parseInt(this.draggedItemId, 10)
      );
      this.treeObj.fields.dataSource = filteredPeople;
      const elements: NodeListOf<HTMLElement> = document.querySelectorAll(
        '.e-drag-item.treeview-external-drag'
      );
      for (const element of [].slice.call(elements)) {
        remove(element);
      }
    }
  }

  public onTreeDragStop(event: DragAndDropEventArgs): void {
    const treeElement: Element = closest(
      event.target,
      '.e-treeview'
    ) as Element;
    const classElement: HTMLElement =
      this.scheduleObj.element.querySelector('.e-device-hover');
    if (classElement) {
      classElement.classList.remove('e-device-hover');
    }
    if (!treeElement) {
      event.cancel = true;
      const scheduleElement: Element = closest(
        event.target,
        '.e-content-wrap'
      ) as Element;
      if (scheduleElement) {
        const treeviewData: Record<string, any>[] = this.treeObj.fields
          .dataSource as Record<string, any>[];
        if (event.target.classList.contains('e-work-cells')) {
          const filteredData: Record<string, any>[] = treeviewData.filter(
            (item: any) =>
              item.Id === parseInt(event.draggedNodeData.id as string, 10)
          );
          const cellData: CellClickEventArgs = this.scheduleObj.getCellDetails(
            event.target
          );
          const resourceDetails: ResourceDetails =
            this.scheduleObj.getResourcesByIndex(cellData.groupIndex);
          const eventData: Record<string, any> = {
            Name: filteredData[0].Name,
            StartTime: cellData.startTime,
            EndTime: cellData.endTime,
            /*IsAllDay: cellData.isAllDay,*/
            Description: filteredData[0].Description,
            /*DepartmentID: resourceDetails.resourceData.GroupId,*/
            ConsultantID: resourceDetails.resourceData.Id,
          };
          this.scheduleObj.openEditor(eventData, 'Add', true);
          this.isTreeItemDropped = true;
          this.draggedItemId = event.draggedNodeData.id as string;
        }
      }
    }
  }
}
