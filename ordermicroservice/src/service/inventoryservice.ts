import {inject} from '@loopback/core';
import {Inventory} from '../models';
import {Order} from '../models';
import {InventoryAdjustedments} from '../enums/enums';

const superagent = require('superagent');
const baseurl = 'http://localhost:3000/';

export class Inventoryservice {
  async GetInventoryById(inventoryId: number): Promise<Inventory> {
    let response;
    let inventoryJson;

    try {
      response = await superagent.get(baseurl + 'inventories/' + inventoryId);

      inventoryJson = JSON.parse(JSON.stringify(response.body));
    } catch (err) {
      console.error(err);
    }

    return new Inventory({
      inventoryid: inventoryJson.id,
      name: inventoryJson.name,
      description: inventoryJson.description,
      price: inventoryJson.price,
    });
  }

  async GetInventoryByName(productName: string): Promise<Inventory[]> {
    let response;
    let inventoryJson;

    try {
      response = await superagent.get(
        baseurl + 'inventories?filter[where][name][eq]=' + productName,
      );

      inventoryJson = JSON.parse(JSON.stringify(response.body));
    } catch (err) {
      console.error(err);
    }

    const invs: Inventory[] = [];

    for (let i = 0; i < inventoryJson.length; i++) {
      invs[i] = new Inventory({
        inventoryid: inventoryJson[i].id,
        name: inventoryJson[i].name,
        description: inventoryJson[i].description,
        price: inventoryJson[i].price,
      });
    }

    return invs;
  }

  async validateInventory(order: Order): Promise<boolean> {
    let response;
    let responseJson;
    let whereClause = '';
    let conditionIndex = 0;

    order.items.forEach(element => {
      whereClause +=
        'filter' +
        '[where][or][' +
        conditionIndex +
        '][name][eq]=' +
        element.productname +
        '&' +
        'filter' +
        '[where][and][' +
        conditionIndex +
        '][availablestock][gte]=' +
        element.quantity +
        '&';
      conditionIndex++;
    });

    try {
      response = await superagent.get(baseurl + 'inventories?' + whereClause);
      // if at least one product has not enough stock or the product is not availble we can not place the order
      if (order.items.length !== response.body.length) return false;

      //convert the request body to json
      responseJson = JSON.parse(JSON.stringify(response.body));
    } catch (err) {
      console.error(err);
    }

    const invs: Inventory[] = [];

    for (let i = 0; i < responseJson.length; i++) {
      invs[i] = new Inventory({
        inventoryid: responseJson[i].id,
        name: responseJson[i].name,
        description: responseJson[i].description,
        price: responseJson[i].price,
      });

      order.items[i].inventoryid = invs[i].inventoryid;
      order.items[i].price = invs[i].price;
      order.items[i].description = invs[i].description;
    }

    //invs.forEach(element => {});
    return true;
  }

  //
  async updateInventory(
    order: Order,
    inventoryadjustedment: InventoryAdjustedments,
  ): Promise<boolean> {
    let newavailablestock: Number;
    let response;
    let invJson;
    try {
      for (const element of order.items) {
        response = await superagent.get(
          baseurl + 'inventories/' + element.inventoryid,
        );
        newavailablestock = 0;
        invJson = JSON.parse(JSON.stringify(response.body));
        if (inventoryadjustedment === InventoryAdjustedments.Take)
          newavailablestock = invJson.availablestock - element.quantity;
        else newavailablestock = invJson.availablestock + element.quantity;

        
        await superagent
          .patch(baseurl + 'inventories/' + element.inventoryid)
          .set('Content-Type', 'application/json')
          .send({availablestock: newavailablestock});
      }
    } catch (err) {
      console.error(err);
      return false;
    }

    return true;
  }
  async GetInventoryAvailableStock(productName: string): Promise<Inventory> {
    let response;
    let inventoryJson;

    try {
      response = await superagent.get(
        baseurl + 'inventories/filter[where][name][eq]=' + productName,
      );

      inventoryJson = JSON.parse(JSON.stringify(response.body));
    } catch (err) {
      console.error(err);
    }

    return new Inventory({
      inventoryid: inventoryJson.id,
      name: inventoryJson.name,
      description: inventoryJson.description,
      price: inventoryJson.price,
    });
  }
}
