/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const ModelElement = require('./modelelement');
const Decorator = require('./decorator');
const IllegalModelException = require('./illegalmodelexception');

// Types needed for TypeScript generation.
/* eslint-disable no-unused-vars */
/* istanbul ignore next */
if (global === undefined) {
    const ModelFile = require('./modelfile');
}
/* eslint-enable no-unused-vars */

/**
 * Decorated defines a model element that may have decorators attached.
 *
 * @private
 * @abstract
 * @class
 * @memberof module:concerto-core
 */
class Decorated extends ModelElement {
    /**
     * Create a Decorated from an Abstract Syntax Tree. The AST is the
     * result of parsing.
     * @param {ModelFile} modelFile - the ModelFile for this decorated
     * @param {*} ast - the AST created by the parser
     * @throws {IllegalModelException}
     */
    constructor(modelFile, ast) {
        super(modelFile, ast);
    }

    /**
     * Extracts the decorators applied to an AST.
     * @param {*} ast - the AST created by the parser
     * @param {ModelManager} modelManager - the ModelManager that supplies decorator factories
     * @returns {Decorator[]} the decorators
     */
    static processDecorators(ast, modelManager) {
        const decorators = [];
        if(ast.decorators) {
            for(let n=0; n < ast.decorators.length; n++ ) {
                let thing = ast.decorators[n];
                let factories = modelManager.getDecoratorFactories();
                let decorator;
                for (let factory of factories) {
                    decorator = factory.newDecorator(this, thing);
                    if (decorator) {
                        break;
                    }
                }
                if (!decorator) {
                    decorator = new Decorator(this, thing);
                }
                decorators.push(decorator);
            }
        }

        return decorators;
    }

    /**
     * Process the AST and build the model
     *
     * @throws {IllegalModelException}
     * @private
     */
    process() {
        this.decorators = Decorated.processDecorators(this.ast, this.getModelFile().getModelManager());
    }

    /**
     * Semantic validation of the structure of this decorated. Subclasses should
     * override this method to impose additional semantic constraints on the
     * contents/relations of fields.
     *
     * @param {...*} args the validation arguments
     * @throws {IllegalModelException}
     * @protected
     */
    validate(...args) {
        if (this.decorators && this.decorators.length > 0) {
            for(let n=0; n < this.decorators.length; n++) {
                this.decorators[n].validate();
            }

            // check we don't have this decorator twice
            const decoratorNames = this.decorators.map(
                d => d.getName()
            );
            const uniqueDecoratorNames = new Set(decoratorNames);

            if (uniqueDecoratorNames.size !== this.decorators.length) {
                const duplicateElements = decoratorNames
                    .filter(
                        (item, index) => decoratorNames.indexOf(item) !== index
                    );
                const modelFile = this.getModelFile();
                throw new IllegalModelException(
                    `Duplicate decorator ${duplicateElements[0]}`,
                    modelFile,
                    this.ast.location,
                );
            }
        }
    }

    /**
     * Returns the decorators for this class.
     *
     * @return {Decorator[]} the decorators for the class
     */
    getDecorators() {
        return this.decorators;
    }

    /**
     * Returns the decorator for this class with a given name.
     * @param {string} name  - the name of the decorator
     * @return {Decorator} the decorator attached to this class with the given name, or null if it does not exist.
     */
    getDecorator(name) {
        for(let n=0; n < this.decorators.length; n++) {
            let decorator = this.decorators[n];
            if(decorator.getName() === name) {
                return decorator;
            }
        }

        return null;
    }
}

module.exports = Decorated;
