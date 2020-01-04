import {Entity, model, property} from '@loopback/repository';

@model()
export class Orderline extends Entity {
  @property({
    type: 'number',
  })
  rownumber?: number;

  @property({
    type: 'number',
    required: true,
  })
  inventoryid?: number;

  @property({
    type: 'string',
    required: true,
  })
  productname: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'number',
    required: true,
  })
  quantity: number;

  @property({
    type: 'number',
    required: true,
  })
  price: number;

  @property({
    type: 'number',
  })
  total: number;

  constructor(data?: Partial<Orderline>) {
    super(data);
  }
}

export interface OrderlineRelations {
  // describe navigational properties here
}

export type OrderlineWithRelations = Orderline & OrderlineRelations;
