import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getModelSchemaRef,
  getWhereSchemaFor,
  patch,
  put,
  del,
  requestBody,
} from '@loopback/rest';
import {Order} from '../models';
import {OrderRepository} from '../repositories';
import {Inventoryservice} from '../service';
import {OrderStatus, InventoryAdjustedments} from '../enums/enums';
import {parse} from 'url';

export class OrderController {
  constructor(
    @repository(OrderRepository)
    public orderRepository: OrderRepository,
  ) {}

  @post('/orders', {
    responses: {
      '200': {
        description: 'Order model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Order),
          },
        },
      },
    },
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Order, {
            title: 'NewOrder',
            exclude: ['id'],
          }),
        },
      },
    })
    order: Omit<Order, 'id'>,
  ): Promise<Order> {
    await this.validateorder(order);

    await this.updateInventory(order, InventoryAdjustedments.Take);
    order = await this.orderRepository.create(order);
    order.orderstatus = OrderStatus[OrderStatus.Placed];
    await this.orderRepository.updateById(order.getId(), order);

    return order;
  }

  /*
validate if there is enought stock for the all product ( items)
  */
  private async validateorder(order: Order): Promise<Boolean> {
    const inventoryservice = new Inventoryservice();

    try {
      return await inventoryservice.validateInventory(order);
    } catch (error) {
      console.log(
        'can not place this order, maybe  stock is not enought or product not available in the inventory ' +
          error,
      );
      return false;
    }
  }
  /*
    request inventory service to deductvalidate if there is enought stock for the all product ( items)
  */
  private async updateInventory(
    order: Order,
    inventoryadjustedment: InventoryAdjustedments,
  ): Promise<Boolean> {
    const inventoryservice = new Inventoryservice();

    try {
      return await inventoryservice.updateInventory(
        order,
        inventoryadjustedment,
      );
    } catch (error) {
      console.log(
        'can not place this order, maybe  stock is not enought or product not available in the inventory ' +
          error,
      );
      return false;
    }
  }

  private async adjustInventory(
    order: Order,
    oldorder: Order,
  ): Promise<Boolean> {
    const inventoryservice = new Inventoryservice();

    try {
      for (let index = 0; index < order.items.length; index++) {
        order.items[index].quantity =
          order.items[index].quantity - oldorder.items[index].quantity;
      }
      return await inventoryservice.updateInventory(
        order,
        InventoryAdjustedments.Take,
      );
    } catch (error) {
      console.log(
        'can not place this order, maybe  stock is not enought or product not available in the inventory ' +
          error,
      );
      return false;
    }
  }

  @get('/orders/count', {
    responses: {
      '200': {
        description: 'Order model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(Order)) where?: Where<Order>,
  ): Promise<Count> {
    return this.orderRepository.count(where);
  }

  @get('/orders', {
    responses: {
      '200': {
        description: 'Array of Order model instances',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: getModelSchemaRef(Order, {includeRelations: true}),
            },
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(Order))
    filter?: Filter<Order>,
  ): Promise<Order[]> {
    return this.orderRepository.find(filter);
  }

  @patch('/orders', {
    responses: {
      '200': {
        description: 'Order PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Order, {partial: true}),
        },
      },
    })
    order: Order,
    @param.query.object('where', getWhereSchemaFor(Order)) where?: Where<Order>,
  ): Promise<Count> {
    return this.orderRepository.updateAll(order, where);
  }

  @get('/orders/{id}', {
    responses: {
      '200': {
        description: 'Order model instance',
        content: {
          'application/json': {
            schema: getModelSchemaRef(Order, {includeRelations: true}),
          },
        },
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.query.object('filter', getFilterSchemaFor(Order))
    filter?: Filter<Order>,
  ): Promise<Order> {
    return this.orderRepository.findById(id, filter);
  }

  @patch('/orders/{id}', {
    responses: {
      '204': {
        description: 'Order PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Order, {partial: true}),
        },
      },
    })
    order: Order,
  ): Promise<void> {
    await this.orderRepository.updateById(id, order);
  }

  @put('/orders/{id}', {
    responses: {
      '204': {
        description: 'Order PUT success',
      },
    },
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() order: Order,
  ): Promise<void> {
    const oldorder: Order = await this.orderRepository.findById(id);
    await this.orderRepository.replaceById(id, order);
    await this.adjustInventory(order, oldorder);
  }

  @del('/orders/{id}', {
    responses: {
      '204': {
        description: 'Order DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    const order: Order = await this.orderRepository.findById(id);
    await this.orderRepository.deleteById(id);
    await this.updateInventory(order, InventoryAdjustedments.Rollback);
    order.orderstatus = OrderStatus[OrderStatus.Canceled];
    await this.orderRepository.updateById(order.getId(), order);
  }
}
