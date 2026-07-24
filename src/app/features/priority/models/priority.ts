export interface PriorityLane {
  id: string;
  name: string;
  position: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PriorityLaneItemOrder {
  laneId: string;
  itemIds: string[];
}
