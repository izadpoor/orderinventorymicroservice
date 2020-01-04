import {Entity, model, property} from '@loopback/repository';

@model({settings: {strict: false}})
export class Inventory extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
    index: {
      unique: true,
    },
  })
  name: string;

  @property({
    type: 'string',
  })
  description?: string;

  @property({
    type: 'number',
    required: true,
  })
  price: number;

  @property({
    type: 'number',
    required: true,
  })
  inventoryid?: number;
  // Define well-known properties here

  // Indexer property to allow additional data
  //[prop: string]: any;

  constructor(data?: Partial<Inventory>) {
    super(data);
  }
}
