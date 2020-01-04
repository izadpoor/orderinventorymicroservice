import {Entity, model, property} from '@loopback/repository';
import {Orderline} from './orderline.model';

@model()
export class Order extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
    required: true,
  })
  orderdate: string;

  @property({
    type: 'string',
    required: true,
  })
  customeremail: string;

  @property({
    type: 'string',
    required: true,
  })
  orderstatus: string;

  @property.array(Orderline, {required: true})
  items: Orderline[];

  constructor(data?: Partial<Order>) {
    super(data);
  }
}

export interface OrderRelations {
  // describe navigational properties here
}

export type OrderWithRelations = Order & OrderRelations;
